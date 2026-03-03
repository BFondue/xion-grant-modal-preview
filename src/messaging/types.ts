/**
 * Message types for SDK <-> Iframe communication
 */
export type IframeMessageType =
  | "IFRAME_READY"
  | "CONNECT"
  | "DISCONNECT"
  | "GET_ADDRESS"
  | "SIGN_TRANSACTION"
  | "SIGN_AND_BROADCAST"
  | "ADD_AUTHENTICATOR"
  | "REMOVE_AUTHENTICATOR"
  | "REQUEST_GRANT";

/**
 * Valid message targets for iframe communication
 */
export const VALID_MESSAGE_TARGETS = ["xion_iframe", "xion_sdk"] as const;
export type MessageTarget = (typeof VALID_MESSAGE_TARGETS)[number];

/**
 * Generic message structure received from SDK
 */
export interface IframeMessage<T = unknown> {
  type: IframeMessageType;
  target?: MessageTarget;
  payload?: T;
  requestId?: string;
}

/**
 * Response wrapper for MessageChannel communication
 */
export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Connect payload
 */
export interface ConnectPayload {
  grantParams?: {
    treasuryAddress: string;
    grantee: string;
  };
}

/**
 * Connect response with user's address
 */
export interface ConnectResponse {
  address: string;
  balance?: string;
}

/**
 * Transaction data for signing
 */
export interface TransactionData {
  messages: Array<{
    typeUrl: string;
    value: unknown;
  }>;
  fee: {
    amount: Array<{
      denom: string;
      amount: string;
    }>;
    gas: string;
    granter?: string;
    payer?: string;
  };
  memo?: string;
}

/**
 * Sign transaction payload
 */
export interface SignTransactionPayload {
  transaction: TransactionData;
}

/**
 * Signed transaction response
 */
export interface SignTransactionResponse {
  signedTx: unknown; // Will be serialized SignDoc
}

/**
 * Get address payload (no data)
 */
export type GetAddressPayload = Record<string, never>;

/**
 * Get address response
 */
export interface GetAddressResponse {
  address: string | null;
}

/**
 * Disconnect payload (no data)
 */
export type DisconnectPayload = Record<string, never>;

/**
 * Disconnect response (no data)
 */
export type DisconnectResponse = Record<string, never>;

/**
 * Authenticator types supported by the system
 */
export type AuthenticatorType =
  | "keplr"
  | "okx"
  | "metamask"
  | "passkey"
  | "email"
  | "apple";

/**
 * Authenticator data structure
 */
export interface AuthenticatorData {
  id: string;
  type: string;
  authenticator: string;
  authenticatorIndex: number;
}

/**
 * Add authenticator payload
 */
export interface AddAuthenticatorPayload {
  type?: AuthenticatorType;
  oAuthToken?: string;
}

/**
 * Add authenticator response
 */
export interface AddAuthenticatorResponse {
  authenticator: AuthenticatorData;
}

/**
 * Remove authenticator payload
 */
export interface RemoveAuthenticatorPayload {
  authenticatorId: number;
}

/**
 * Remove authenticator response
 */
export interface RemoveAuthenticatorResponse {
  success: boolean;
}

/**
 * Request grant payload
 */
export interface RequestGrantPayload {
  /** Treasury contract address that defines the grant permissions */
  treasuryAddress: string;
  /** Grantee address (DAPP's meta-account) that will receive authorization */
  grantee: string;
}

/**
 * Request grant response
 */
export interface RequestGrantResponse {
  success: boolean;
}
