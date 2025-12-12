/**
 * Types for wallet-based smart account creation
 */

export type WalletType = "EthWallet" | "Secp256K1";

export interface PrepareSignatureRequest {
  wallet_type: WalletType;
  address?: string; // Required for EthWallet
  pubkey?: string; // Required for Secp256K1
}

export interface PrepareSignatureResponse {
  message_to_sign: string;
  predicted_address: string;
  salt: string;
  wallet_type: string;
  metadata: {
    action: string;
    wallet_type: string;
    address?: string;
    pubkey?: string;
    timestamp: number;
  };
}

export interface CreateWalletAccountRequest {
  salt: string;
  wallet_type: WalletType;
  address?: string; // Required for EthWallet
  pubkey?: string; // Required for Secp256K1
  signature: string;
  message: string; // JSON stringified metadata
}

export interface CreateWalletAccountResponse {
  account_address: string;
  code_id: number;
  transaction_hash: string;
}

export interface WalletConnectionInfo {
  type: WalletType;
  address?: string; // Wallet address (for display)
  pubkey?: string; // Public key hex
  identifier: string; // What gets stored as authenticator
}
