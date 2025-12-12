/**
 * API functions for wallet-based smart account creation (V2)
 */

import { getErrorMessageForUI, WalletAccountError } from "../utils";
import type {
  PrepareSignatureRequest,
  PrepareSignatureResponse,
} from "../types";

/**
 * Gets predicted smart account address from V2 API
 * This replaces the V1 /prepare endpoint
 */
export async function callPrepare(
  apiUrl: string,
  request: PrepareSignatureRequest,
): Promise<PrepareSignatureResponse> {
  try {
    // V2 API: Use type-specific address endpoints
    // URL-encode the pubkey/address to handle special characters (/, +, =) in base64
    const endpoint =
      request.wallet_type === "EthWallet"
        ? `${apiUrl}/api/v2/account/address/ethwallet/${encodeURIComponent(request.address)}`
        : `${apiUrl}/api/v2/account/address/secp256k1/${encodeURIComponent(request.pubkey)}`;

    const response = await fetch(endpoint, {
      method: "GET",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.error?.message || "Failed to get predicted address",
      );
    }

    const data = await response.json();

    // V2 returns { address, authenticator_type }
    // Transform to match V1 PrepareSignatureResponse format
    return {
      message_to_sign: data.address, // The predicted address is what needs to be signed
      predicted_address: data.address,
      salt: "", // V2 doesn't use salt
      wallet_type: request.wallet_type,
      metadata: {
        action: "create_account",
        wallet_type: request.wallet_type,
        address: request.address,
        pubkey: request.pubkey,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    throw new WalletAccountError(
      "Failed to get predicted address",
      getErrorMessageForUI(error),
      error,
    );
  }
}
