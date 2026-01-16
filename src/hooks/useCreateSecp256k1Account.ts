/**
 * Secp256k1 Wallet Account Creation Hook
 *
 * Creates Cosmos wallet-based smart accounts (Keplr/Leap/OKX) via the AA API v2 using xion.js.
 */

import { createSecp256k1Account } from "@burnt-labs/abstraxion-core";
import { AUTHENTICATOR_TYPE } from "@burnt-labs/signers";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import {
  getSecp256k1Pubkey,
  WalletAccountError,
  getErrorMessageForUI,
} from "../utils";
import {
  ABSTRAXION_API_URL,
  FEE_GRANTER_ADDRESS,
  DEFAULT_ACCOUNT_CONTRACT_CODE_ID,
  XION_RPC_URL,
} from "../config";

export interface WalletConnectionInfo {
  type: "EthWallet" | "Secp256K1";
  address: string;
  pubkey?: string;
  identifier: string;
}

export interface CreateWalletAccountResult {
  accountAddress: string;
  codeId: number;
  transactionHash: string;
  walletInfo: WalletConnectionInfo;
}

/**
 * Fetches contract checksum for the default smart account code ID
 */
async function getContractChecksum(
  rpcUrl: string,
  codeId: string,
): Promise<string> {
  try {
    const client = await CosmWasmClient.connect(rpcUrl);
    const codeDetails = await client.getCodeDetails(parseInt(codeId, 10));

    if (!codeDetails?.checksum) {
      throw new Error("Failed to get contract checksum");
    }

    return codeDetails.checksum;
  } catch (error) {
    throw new WalletAccountError(
      "Failed to fetch contract checksum",
      "Could not retrieve smart account contract details. Please try again.",
      error,
    );
  }
}

/**
 * Extracts address prefix from chain ID (e.g., "xion-testnet-2" -> "xion")
 */
function getAddressPrefix(chainId: string): string {
  const prefix = chainId.split("-")[0];
  if (!prefix) {
    throw new Error(`Invalid chain ID: ${chainId}`);
  }
  return prefix;
}

/**
 * Creates a Cosmos wallet-based smart account (Keplr/Leap/OKX) using xion.js
 * Uses dashboard config for API URL, fee granter, etc.
 */
export async function createSecp256k1SmartAccount(
  chainId: string,
  walletName: "keplr" | "leap" | "okx",
): Promise<CreateWalletAccountResult> {
  try {
    // 1. Get public key
    const {
      pubkeyBase64,
      pubkeyHex,
      address: walletAddress,
    } = await getSecp256k1Pubkey(chainId, walletName);

    // 2. Fetch contract checksum
    const checksum = await getContractChecksum(
      XION_RPC_URL,
      DEFAULT_ACCOUNT_CONTRACT_CODE_ID,
    );

    // 3. Get address prefix from chain ID
    const addressPrefix = getAddressPrefix(chainId);

    // 4. Create sign function - MUST use signArbitrary for account creation
    // The backend verifySecp256k1Signature supports ADR-036 wrapped signatures from Keplr
    const signMessageFn = async (hexMessage: string): Promise<string> => {
      let wallet: NonNullable<Window["keplr"]>;

      switch (walletName) {
        case "keplr":
          if (!window.keplr) {
            throw new WalletAccountError(
              "Keplr not installed",
              "Keplr wallet not found.",
            );
          }
          wallet = window.keplr;
          break;
        case "leap":
          if (!window.leap) {
            throw new WalletAccountError(
              "Leap not installed",
              "Leap wallet not found.",
            );
          }
          wallet = window.leap;
          break;
        case "okx":
          if (!window.okxwallet?.keplr) {
            throw new WalletAccountError(
              "OKX not installed",
              "OKX wallet not found.",
            );
          }
          wallet = window.okxwallet.keplr;
          break;
      }

      // createSecp256k1Account passes hex-encoded messages (with 0x prefix)
      // Convert hex to UTF-8 string for signArbitrary
      const hexWithoutPrefix = hexMessage.startsWith("0x")
        ? hexMessage.slice(2)
        : hexMessage;

      const message = Buffer.from(hexWithoutPrefix, "hex").toString("utf8");

      // CRITICAL: Use signArbitrary which creates an ADR-036 wrapped signature
      // The backend's verifySecp256k1Signature handles BOTH:
      // 1. Direct SHA256 signatures (for programmatic signers)
      // 2. ADR-036 wrapped signatures (for Keplr/Leap/OKX)
      const signArbResult = await (wallet as any).signArbitrary(
        chainId,
        walletAddress,
        message,
      );

      if (!signArbResult || !signArbResult.signature) {
        throw new WalletAccountError(
          "No signature returned",
          "Failed to get signature from wallet.",
        );
      }

      // Return base64 signature - createSecp256k1Account will format it to hex
      // (createSecp256k1Account calls formatSecp256k1Signature internally)
      return signArbResult.signature;
    };

    // 5. Create account via xion.js
    const result = await createSecp256k1Account(
      ABSTRAXION_API_URL,
      pubkeyBase64,
      signMessageFn,
      checksum,
      FEE_GRANTER_ADDRESS,
      addressPrefix,
      XION_RPC_URL,
    );

    console.log(
      "[createSecp256k1SmartAccount] Transaction hash:",
      result.transaction_hash,
    );

    return {
      accountAddress: result.account_address,
      codeId: result.code_id,
      transactionHash: result.transaction_hash,
      walletInfo: {
        type: AUTHENTICATOR_TYPE.Secp256K1,
        address: walletAddress,
        pubkey: pubkeyHex,
        identifier: pubkeyBase64, // Use base64 pubkey for indexer queries
      },
    };
  } catch (error) {
    // Log the full error for debugging
    console.error("[createSecp256k1SmartAccount] Full error details:", error);
    if (error instanceof Error) {
      console.error(
        "[createSecp256k1SmartAccount] Error message:",
        error.message,
      );
      console.error("[createSecp256k1SmartAccount] Error stack:", error.stack);
    }

    throw new WalletAccountError(
      "Failed to create Cosmos wallet account",
      getErrorMessageForUI(error),
      error,
    );
  }
}
