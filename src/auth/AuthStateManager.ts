/**
 * AuthStateManager - Unified authentication state management
 *
 * This singleton class is the SINGLE SOURCE OF TRUTH for all auth state.
 * It consolidates state that was previously scattered across:
 * - React Context (AuthContext)
 * - localStorage (loginType, loginAuthenticator, okxXionAddress, okxWalletName)
 * - sessionStorage (xion_session_{origin})
 * - Hook local state (useSmartAccount, useIframeSession)
 *
 * Benefits:
 * - Clear state machine: disconnected → connecting → connected → disconnecting
 * - Single place to understand auth flow
 * - No sync issues between multiple stores
 * - Easy to debug/log all state transitions
 */

import { SelectedSmartAccount } from "../types/wallet-account-types";
import { SessionManager } from "./session";
import type { AuthenticatorType } from "@burnt-labs/signers";
import { AUTHENTICATOR_TYPE } from "@burnt-labs/signers";

// Connection types supported
export type ConnectionType =
  | "stytch"
  | "shuttle"
  | "metamask"
  | "okx"
  | "passkey"
  | "none";

/**
 * Connection type constants
 * Use these instead of string literals to avoid typos and ensure type safety
 */
export const CONNECTION_TYPE = Object.freeze({
  Stytch: "stytch" as const, // Stytch social login
  Shuttle: "shuttle" as const, // Keplr/Cosmos wallets via Shuttle
  Metamask: "metamask" as const, // MetaMask wallet
  OKX: "okx" as const, // OKX wallet
  Passkey: "passkey" as const, // WebAuthn/Passkey
  None: "none" as const, // No connection
});

// Auth state machine states
export type AuthStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "disconnecting";

// Full auth state
export interface AuthState {
  status: AuthStatus;
  connectionType: ConnectionType;
  account: SelectedSmartAccount | undefined;
  authenticator: string | null;
  authenticatorType: AuthenticatorType | null;
  error: string | null;
}

// Listener type for state changes
export type AuthStateListener = (
  state: AuthState,
  prevState: AuthState,
) => void;

// Storage keys - centralized in one place
export const AUTH_STORAGE_KEYS = {
  LOGIN_TYPE: "loginType",
  LOGIN_AUTHENTICATOR: "loginAuthenticator",
  OKX_XION_ADDRESS: "okxXionAddress",
  OKX_WALLET_NAME: "okxWalletName",
} as const;

// Valid connection types for validation
const VALID_CONNECTION_TYPES: ConnectionType[] = [
  "stytch",
  "shuttle",
  "metamask",
  "okx",
  "passkey",
];

/**
 * Maps ConnectionType to AuthenticatorType
 * This allows us to store the authenticator type without needing to detect it later
 */
function connectionTypeToAuthenticatorType(
  connectionType: ConnectionType,
): AuthenticatorType | null {
  switch (connectionType) {
    case CONNECTION_TYPE.Stytch:
      return AUTHENTICATOR_TYPE.JWT;
    case CONNECTION_TYPE.Passkey:
      return AUTHENTICATOR_TYPE.Passkey;
    case CONNECTION_TYPE.Shuttle:
    case CONNECTION_TYPE.OKX:
      // Both Shuttle and OKX use Keplr API and provide base64-encoded secp256k1 pubkeys
      return AUTHENTICATOR_TYPE.Secp256K1;
    case CONNECTION_TYPE.Metamask:
      return AUTHENTICATOR_TYPE.EthWallet;
    case CONNECTION_TYPE.None:
      return null;
  }
}

class AuthStateManagerClass {
  private state: AuthState = {
    status: "disconnected",
    connectionType: "none",
    account: undefined,
    authenticator: null,
    authenticatorType: null,
    error: null,
  };

  // Cached snapshot for useSyncExternalStore - MUST return same reference if state unchanged
  private stateSnapshot: Readonly<AuthState> = this.state;

  private listeners = new Set<AuthStateListener>();
  private initialized = false;

  /**
   * Initialize from localStorage on startup
   * Should be called once when the app loads
   */
  initialize(): void {
    if (this.initialized) return;

    const storedType = localStorage.getItem(AUTH_STORAGE_KEYS.LOGIN_TYPE);
    const storedAuth = localStorage.getItem(
      AUTH_STORAGE_KEYS.LOGIN_AUTHENTICATOR,
    );

    // Validate stored type is a valid connection type
    const isValidType =
      storedType &&
      VALID_CONNECTION_TYPES.includes(storedType as ConnectionType);

    if (isValidType && storedAuth) {
      const connectionType = storedType as ConnectionType;
      this.state = {
        ...this.state,
        status: "connecting", // Will become 'connected' once account is loaded
        connectionType,
        authenticator: storedAuth,
        authenticatorType: connectionTypeToAuthenticatorType(connectionType),
      };
      // Update snapshot to reflect initialized state
      this.stateSnapshot = { ...this.state };
      console.log("[AuthStateManager] Initialized with stored credentials:", {
        type: storedType,
        authenticatorType: this.state.authenticatorType,
        authenticator: storedAuth.substring(0, 20) + "...",
      });
    } else {
      console.log("[AuthStateManager] Initialized in disconnected state");
    }

    this.initialized = true;
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: AuthStateListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state (read-only snapshot)
   * IMPORTANT: Returns same reference if state unchanged - required for useSyncExternalStore
   */
  getState(): Readonly<AuthState> {
    return this.stateSnapshot;
  }

  /**
   * Check if fully connected (has account)
   */
  isConnected(): boolean {
    return this.state.status === "connected" && !!this.state.account;
  }

  /**
   * Check if in connecting state
   */
  isConnecting(): boolean {
    return this.state.status === "connecting";
  }

  /**
   * Check if in disconnecting state
   */
  isDisconnecting(): boolean {
    return this.state.status === "disconnecting";
  }

  /**
   * Get address if connected
   */
  getAddress(): string | null {
    return this.state.account?.id ?? null;
  }

  /**
   * Get current authenticator
   */
  getAuthenticator(): string | null {
    return this.state.authenticator;
  }

  /**
   * Get current authenticator type
   */
  getAuthenticatorType(): AuthenticatorType | null {
    return this.state.authenticatorType;
  }

  /**
   * Get connection type
   */
  getConnectionType(): ConnectionType {
    return this.state.connectionType;
  }

  /**
   * Get current account
   */
  getAccount(): SelectedSmartAccount | undefined {
    return this.state.account;
  }

  // --- State Transitions ---

  /**
   * Start login process
   * Transitions: disconnected → connecting
   */
  startLogin(
    type: ConnectionType,
    authenticator: string,
    authenticatorType?: AuthenticatorType,
  ): void {
    const prevState = { ...this.state };

    // Use provided authenticatorType, or fall back to deriving from connectionType
    const authType =
      authenticatorType ?? connectionTypeToAuthenticatorType(type);

    this.state = {
      ...this.state,
      status: "connecting",
      connectionType: type,
      authenticator,
      authenticatorType: authType,
      error: null,
    };

    // Persist to localStorage
    localStorage.setItem(AUTH_STORAGE_KEYS.LOGIN_TYPE, type);
    localStorage.setItem(AUTH_STORAGE_KEYS.LOGIN_AUTHENTICATOR, authenticator);

    console.log("[AuthStateManager] Login started:", {
      type,
      authenticatorType: this.state.authenticatorType,
      authenticator: authenticator.substring(0, 20) + "...",
    });

    this.notifyListeners(prevState);
    this.dispatchStorageEvent(
      AUTH_STORAGE_KEYS.LOGIN_AUTHENTICATOR,
      authenticator,
    );
  }

  /**
   * Complete login with account
   * Transitions: connecting → connected
   */
  completeLogin(account: SelectedSmartAccount): void {
    const prevState = { ...this.state };

    this.state = {
      ...this.state,
      status: "connected",
      account,
      error: null,
    };

    console.log("[AuthStateManager] Login completed:", {
      address: account.id,
      authenticatorIndex: account.currentAuthenticatorIndex,
    });

    this.notifyListeners(prevState);
  }

  /**
   * Set OKX-specific wallet data
   */
  setOkxData(address: string, name: string): void {
    localStorage.setItem(AUTH_STORAGE_KEYS.OKX_XION_ADDRESS, address);
    localStorage.setItem(AUTH_STORAGE_KEYS.OKX_WALLET_NAME, name);
    console.log("[AuthStateManager] OKX data set:", { address, name });
  }

  /**
   * Get OKX-specific wallet data
   */
  getOkxData(): { address: string | null; name: string | null } {
    return {
      address: localStorage.getItem(AUTH_STORAGE_KEYS.OKX_XION_ADDRESS),
      name: localStorage.getItem(AUTH_STORAGE_KEYS.OKX_WALLET_NAME),
    };
  }

  /**
   * Logout - clears all auth state and storage
   * Transitions: any → disconnecting → disconnected
   */
  async logout(origin?: string, stytchClient?: any): Promise<void> {
    const prevState = { ...this.state };

    // Transition to disconnecting
    this.state = {
      ...this.state,
      status: "disconnecting",
    };
    this.notifyListeners(prevState);

    console.log("[AuthStateManager] Logout started");

    // Revoke Stytch session if applicable
    if (prevState.connectionType === "stytch" && stytchClient) {
      try {
        const tokens = stytchClient.session?.getTokens?.();
        if (tokens) {
          await stytchClient.session.revoke();
          console.log("[AuthStateManager] Stytch session revoked");
        }
      } catch (error) {
        console.warn(
          "[AuthStateManager] Error revoking Stytch session:",
          error,
        );
      }
    }

    // Clear sessionStorage for origin
    if (origin) {
      SessionManager.clearSession(origin);
      console.log("[AuthStateManager] Session cleared for origin:", origin);
    }

    // Clear all localStorage auth data
    localStorage.removeItem(AUTH_STORAGE_KEYS.LOGIN_TYPE);
    localStorage.removeItem(AUTH_STORAGE_KEYS.LOGIN_AUTHENTICATOR);
    localStorage.removeItem(AUTH_STORAGE_KEYS.OKX_XION_ADDRESS);
    localStorage.removeItem(AUTH_STORAGE_KEYS.OKX_WALLET_NAME);

    // Final state - fully disconnected
    const disconnectingState = { ...this.state };
    this.state = {
      status: "disconnected",
      connectionType: "none",
      account: undefined,
      authenticator: null,
      authenticatorType: null,
      error: null,
    };

    console.log("[AuthStateManager] Logout completed");

    this.notifyListeners(disconnectingState);
    this.dispatchStorageEvent(AUTH_STORAGE_KEYS.LOGIN_AUTHENTICATOR, null);

    // Notify parent window (for iframe scenarios)
    try {
      window.parent.postMessage({ type: "DISCONNECTED" }, "*");
    } catch {
      // Ignore if not in iframe context
    }
  }

  /**
   * Set error state
   */
  setError(error: string): void {
    const prevState = { ...this.state };
    this.state = { ...this.state, error };
    console.error("[AuthStateManager] Error:", error);
    this.notifyListeners(prevState);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    if (this.state.error) {
      const prevState = { ...this.state };
      this.state = { ...this.state, error: null };
      this.notifyListeners(prevState);
    }
  }

  /**
   * Update account (e.g., after authenticator change or account selection)
   */
  updateAccount(account: SelectedSmartAccount): void {
    const prevState = { ...this.state };
    this.state = {
      ...this.state,
      account,
      status: "connected", // Ensure we're in connected state
    };
    console.log("[AuthStateManager] Account updated:", {
      address: account.id,
      authenticatorIndex: account.currentAuthenticatorIndex,
    });
    this.notifyListeners(prevState);
  }

  /**
   * Reset to disconnected state without clearing storage
   * Used when session expires or becomes invalid
   */
  resetState(): void {
    const prevState = { ...this.state };
    this.state = {
      status: "disconnected",
      connectionType: "none",
      account: undefined,
      authenticator: null,
      authenticatorType: null,
      error: null,
    };
    console.log("[AuthStateManager] State reset");
    this.notifyListeners(prevState);
  }

  // --- Private Helpers ---

  private notifyListeners(prevState: AuthState): void {
    // Create new snapshot - this signals to useSyncExternalStore that state changed
    this.stateSnapshot = { ...this.state };

    this.listeners.forEach((listener) => {
      try {
        listener(this.stateSnapshot, prevState);
      } catch (error) {
        console.error("[AuthStateManager] Listener error:", error);
      }
    });
  }

  private dispatchStorageEvent(key: string, value: string | null): void {
    // Dispatch storage event for cross-window/cross-component sync
    window.dispatchEvent(
      new StorageEvent("storage", {
        key,
        newValue: value,
        storageArea: localStorage,
      }),
    );
  }
}

// Singleton instance - the SINGLE SOURCE OF TRUTH
export const AuthStateManager = new AuthStateManagerClass();
