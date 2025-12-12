/**
 * High-level workflows for wallet-based smart account creation
 */

import {
  getEthWalletAddress,
  getSecp256k1Pubkey,
  signWithEthWallet,
  signWithSecp256k1Wallet,
} from "../utils";
import { callPrepare } from "./useWalletAccountPrepare";
import type {
  WalletConnectionInfo,
  CreateWalletAccountRequest,
  CreateWalletAccountResponse,
} from "../types";
import { getErrorMessageForUI, WalletAccountError } from "../utils";

/**
 * Creates a wallet-based smart account via backend API (V2)
 */
export async function createWalletAccount(
  apiUrl: string,
  request: CreateWalletAccountRequest,
): Promise<CreateWalletAccountResponse> {
  try {
    // V2 API: Use type-specific create endpoints
    const endpoint =
      request.wallet_type === "EthWallet"
        ? `${apiUrl}/api/v2/accounts/create/ethwallet`
        : `${apiUrl}/api/v2/accounts/create/secp256k1`;

    // V2 API: Simplified request body (no salt, message, or wallet_type)
    const body =
      request.wallet_type === "EthWallet"
        ? {
            address: request.address,
            signature: request.signature,
          }
        : {
            pubKey: request.pubkey, // Note: V2 uses 'pubKey' (capital K)
            signature: request.signature,
          };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("API Error Response:", error);
      throw new Error(
        error.error?.message || "Failed to create wallet account",
      );
    }

    return await response.json();
  } catch (error) {
    throw new WalletAccountError(
      "Failed to create wallet account",
      getErrorMessageForUI(error),
      error,
    );
  }
}

/**
 * Creates a MetaMask-based smart account
 */
export async function createAccountWithMetaMask(apiUrl: string): Promise<{
  accountAddress: string;
  codeId: number;
  transactionHash: string;
  walletInfo: WalletConnectionInfo;
}> {
  // 1. Get Ethereum address
  const ethAddress = await getEthWalletAddress();

  // 2. Call backend prepare endpoint
  const { message_to_sign, salt, metadata } = await callPrepare(apiUrl, {
    wallet_type: "EthWallet",
    address: ethAddress,
  });

  // 3. Get user signature
  const signature = await signWithEthWallet(message_to_sign, ethAddress);

  // 4. Create account
  const result = await createWalletAccount(apiUrl, {
    salt,
    wallet_type: "EthWallet",
    address: ethAddress,
    signature,
    message: JSON.stringify(metadata),
  });

  return {
    accountAddress: result.account_address,
    codeId: result.code_id,
    transactionHash: result.transaction_hash,
    walletInfo: {
      type: "EthWallet",
      address: ethAddress,
      identifier: ethAddress,
    },
  };
}

/**
 * Creates a Cosmos wallet-based smart account (Keplr/Leap/OKX)
 */
export async function createAccountWithCosmosWallet(
  apiUrl: string,
  chainId: string,
  walletName: "keplr" | "leap" | "okx",
): Promise<{
  accountAddress: string;
  codeId: number;
  transactionHash: string;
  walletInfo: WalletConnectionInfo;
}> {
  // 1. Get public key
  const {
    pubkeyHex,
    pubkeyBase64,
    address: walletAddress,
  } = await getSecp256k1Pubkey(chainId, walletName);

  // 2. Call backend prepare endpoint - use base64 for API
  const { message_to_sign, salt, metadata } = await callPrepare(apiUrl, {
    wallet_type: "Secp256K1",
    pubkey: pubkeyBase64,
  });

  // 3. Get user signature
  // Pass the plain bech32 address to sign
  const signature = await signWithSecp256k1Wallet(
    message_to_sign,
    chainId,
    walletAddress,
    walletName,
  );

  // 4. Create account - use base64 for API
  const result = await createWalletAccount(apiUrl, {
    salt,
    wallet_type: "Secp256K1",
    pubkey: pubkeyBase64,
    signature,
    message: JSON.stringify(metadata),
  });

  return {
    accountAddress: result.account_address,
    codeId: result.code_id,
    transactionHash: result.transaction_hash,
    walletInfo: {
      type: "Secp256K1",
      address: walletAddress,
      pubkey: pubkeyHex,
      identifier: pubkeyBase64, // Use base64 pubkey for indexer queries
    },
  };
}
