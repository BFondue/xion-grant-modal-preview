/**
 * Ethereum Wallet Account Creation Hook
 *
 * Creates MetaMask-based smart accounts via the AA API v2 using xion.js.
 */

import { createEthWalletAccount } from "@burnt-labs/abstraxion-core";
import { AUTHENTICATOR_TYPE } from "@burnt-labs/signers";
import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import {
  getEthWalletAddress,
  WalletAccountError,
  getErrorMessageForUI,
} from "../utils";
import {
  ABSTRAXION_API_URL,
  FEE_GRANTER_ADDRESS,
  DEFAULT_ACCOUNT_CONTRACT_CODE_ID,
  XION_RPC_URL,
  CHAIN_ID,
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
 * Creates a MetaMask-based smart account using xion.js
 * Uses dashboard config for API URL, fee granter, etc.
 */
export async function createEthWalletSmartAccount(): Promise<CreateWalletAccountResult> {
  try {
    // 1. Get Ethereum address
    const ethAddress = await getEthWalletAddress();

    // 2. Fetch contract checksum
    const checksum = await getContractChecksum(
      XION_RPC_URL,
      DEFAULT_ACCOUNT_CONTRACT_CODE_ID,
    );

    // 3. Get address prefix from chain ID
    const addressPrefix = getAddressPrefix(CHAIN_ID);

    // 4. Create sign function that signs hex messages
    const signMessageFn = async (hexMessage: string): Promise<string> => {
      if (!window.ethereum) {
        throw new WalletAccountError(
          "MetaMask not installed",
          "MetaMask wallet not found.",
        );
      }

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [hexMessage, ethAddress],
      })) as string;

      if (!signature) {
        throw new WalletAccountError(
          "No signature returned",
          "Failed to get signature from wallet.",
        );
      }

      return signature;
    };

    // 5. Create account via xion.js
    const result = await createEthWalletAccount(
      ABSTRAXION_API_URL,
      ethAddress,
      signMessageFn,
      checksum,
      FEE_GRANTER_ADDRESS,
      addressPrefix,
      XION_RPC_URL,
    );

    return {
      accountAddress: result.account_address,
      codeId: result.code_id,
      transactionHash: result.transaction_hash,
      walletInfo: {
        type: AUTHENTICATOR_TYPE.EthWallet,
        address: ethAddress,
        identifier: ethAddress,
      },
    };
  } catch (error) {
    throw new WalletAccountError(
      "Failed to create MetaMask account",
      getErrorMessageForUI(error),
      error,
    );
  }
}
