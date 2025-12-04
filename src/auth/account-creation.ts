/**
 * Account Creation Service
 * 
 * Handles abstract account creation via the Account Abstraction API.
 * This unifies the account creation flow for all authenticator types (JWT, wallet, etc.)
 * by moving the AA API interaction to the dashboard instead of the stytch-proxy.
 */

import { decodeJwt } from 'jose';
import type { SelectedSmartAccount, Authenticator } from '../indexer-strategies/types';

interface CreateJwtAccountParams {
  sessionJwt: string;
  sessionToken: string;
  apiUrl: string;
}

interface CreateJwtAccountResponse {
  account_address: string;
  code_id: number;
  transaction_hash: string;
}

/**
 * Creates or retrieves a JWT-based abstract account via the AA API.
 * 
 * This function:
 * 1. Calls the AA API v2 create endpoint
 * 2. The API handles both new account creation and existing account lookup
 * 3. Returns the account details including address and codeId
 * 
 * @param params - Session JWT, token, and API URL
 * @returns The created/retrieved abstract account ready for use
 */
export async function createJwtAbstractAccount(
  params: CreateJwtAccountParams
): Promise<SelectedSmartAccount> {
  const { sessionJwt, sessionToken, apiUrl } = params;

  console.log('[AccountCreation] Creating JWT abstract account via AA API');
  
  // Build request body - only include the session credential that has a value
  const requestBody: { session_jwt?: string; session_token?: string } = {};
  if (sessionJwt) {
    requestBody.session_jwt = sessionJwt;
  }
  if (sessionToken) {
    requestBody.session_token = sessionToken;
  }
  
  const response = await fetch(`${apiUrl}/api/v2/accounts/create/jwt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[AccountCreation] AA API error:', response.status, errorBody);
    throw new Error(`Failed to create abstract account: ${response.status} ${errorBody}`);
  }

  const result: CreateJwtAccountResponse = await response.json();

  // Determine if this was a new account creation or existing account retrieval
  // Real tx hashes are 64 hex chars, while addressHash is base64-encoded address
  const isNewAccount = /^[A-Fa-f0-9]{64}$/.test(result.transaction_hash);
  console.log('[AccountCreation] Account', isNewAccount ? 'CREATED' : 'RETRIEVED', ':', result.account_address);
  console.log('[AccountCreation] Transaction hash:', result.transaction_hash, isNewAccount ? '(real tx)' : '(addressHash - existing account)');

  // Extract authenticator from JWT
  const { aud, sub } = decodeJwt(sessionJwt);
  if (!aud || !sub) {
    throw new Error('Invalid JWT: missing aud or sub claims');
  }
  const audience = Array.isArray(aud) ? aud[0] : aud;
  const authenticator = `${audience}.${sub}`;

  // Construct the SelectedSmartAccount object
  const authenticatorData: Authenticator = {
    id: `${result.account_address}-0`,
    type: 'Jwt',
    authenticator,
    authenticatorIndex: 0,
  };

  return {
    id: result.account_address,
    codeId: result.code_id,
    authenticators: [authenticatorData],
    currentAuthenticatorIndex: 0,
  };
}

/**
 * Checks if an abstract account exists for the given JWT authenticator.
 * 
 * @param sessionJwt - The session JWT
 * @param apiUrl - The AA API base URL
 * @returns The account address if exists, null otherwise
 */
export async function checkJwtAccountExists(
  sessionJwt: string,
  apiUrl: string
): Promise<string | null> {
  console.log('[AccountCreation] Checking if JWT account exists');

  // Extract authenticator from JWT
  const { aud, sub } = decodeJwt(sessionJwt);
  if (!aud || !sub) {
    console.error('[AccountCreation] Invalid JWT: missing aud or sub claims');
    return null;
  }
  const audience = Array.isArray(aud) ? aud[0] : aud;
  const authenticator = `${audience}.${sub}`;

  const response = await fetch(`${apiUrl}/api/v2/accounts/check/jwt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      authenticator,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      console.log('[AccountCreation] No existing account found');
      return null;
    }
    throw new Error(`Failed to check account: ${response.status}`);
  }

  const result = await response.json();
  return result.account_address || null;
}
