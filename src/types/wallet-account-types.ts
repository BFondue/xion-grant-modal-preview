/**
 * Types for wallet-based smart account creation
 * Uses xion.js AccountType (lowercase) for consistency with API
 */

import type { AccountType, CreateAccountResponseV2 } from "@burnt-labs/signers";
import type { SmartAccountWithCodeId } from "@burnt-labs/account-management";

// Align with xion.js AccountType (lowercase: "ethwallet", "secp256k1")
export type WalletType = Extract<AccountType, "ethwallet" | "secp256k1">;

// Map CreateAccountResponseV2 from xion.js
export type CreateWalletAccountResponse = CreateAccountResponseV2;

// Dashboard-specific types (UI state)
export interface WalletConnectionInfo {
  type: WalletType;
  address?: string; // Wallet address (for display)
  pubkey?: string; // Public key hex
  identifier: string; // What gets stored as authenticator
}

/**
 * Smart account with selected authenticator index
 * Extends SmartAccountWithCodeId from xion.js with dashboard-specific state
 */
export interface SelectedSmartAccount extends SmartAccountWithCodeId {
  currentAuthenticatorIndex: number;
}
