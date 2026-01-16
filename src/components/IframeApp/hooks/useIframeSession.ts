/**
 * useIframeSession - Hook for managing iframe session extraction and authentication
 *
 * This hook has been updated to use AuthStateManager for login state management.
 * Key changes:
 * - Uses startLogin from AuthStateManager instead of direct localStorage writes
 * - Uses getLoginAuthenticatorFromJWT from jwt-utils
 * - No more manual storage event dispatch - AuthStateManager handles it
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { useStytch, useStytchSession } from "@stytch/react";
import {
  SessionManager,
  getLoginAuthenticatorFromJWT,
  getAddressFromSession,
  getAddressFromJWT,
  getAuthenticatorIndexFromSession,
  getAuthenticatorIndexFromJWT,
} from "../../../auth/session";
import { useAuthState } from "../../../auth/useAuthState";
import { CONNECTION_TYPE } from "../../../auth/AuthStateManager";
import { AUTHENTICATOR_TYPE } from "@burnt-labs/signers";
import { AuthStateManager } from "../../../auth/AuthStateManager";

interface UseIframeSessionOptions {
  currentOrigin: string | null;
  onAuthenticated?: (address: string) => void;
  trigger?: number;
  isDisconnecting?: boolean;
}

/**
 * Custom hook to manage iframe session extraction and authentication
 * Consolidates the complex session logic from IframeApp
 */
export function useIframeSession({
  currentOrigin,
  onAuthenticated,
  trigger = 0,
  isDisconnecting = false,
}: UseIframeSessionOptions) {
  const { session } = useStytchSession();
  const stytch = useStytch();
  const [addressByOrigin, setAddressByOrigin] = useState<
    Record<string, string>
  >({});

  // Use AuthStateManager via hook
  const { startLogin } = useAuthState();

  // Use ref to avoid onAuthenticated causing re-renders
  const onAuthenticatedRef = useRef(onAuthenticated);
  useEffect(() => {
    onAuthenticatedRef.current = onAuthenticated;
  }, [onAuthenticated]);

  useEffect(() => {
    // Don't process session during disconnect to prevent race conditions
    if (isDisconnecting) {
      console.log(
        "[useIframeSession] Skipping session processing during disconnect",
      );
      return;
    }

    if (!currentOrigin || !stytch) return;

    // Get session tokens from Stytch SDK - the single source of truth
    const tokens = stytch.session.getTokens();
    if (!tokens?.session_jwt) {
      // No valid session
      return;
    }

    const sessionJwt = tokens.session_jwt;
    const sessionToken = tokens.session_token;

    // Extract address from session or JWT using centralized utilities
    const extractedAddress =
      getAddressFromSession(session) || getAddressFromJWT(sessionJwt);
    const authenticatorIndex =
      getAuthenticatorIndexFromSession(session) ??
      getAuthenticatorIndexFromJWT(sessionJwt);

    // Extract and store login authenticator using AuthStateManager
    const loginAuthenticator = getLoginAuthenticatorFromJWT(sessionJwt);
    if (loginAuthenticator) {
      // Use AuthStateManager to handle all storage and event dispatch
      startLogin(
        CONNECTION_TYPE.Stytch,
        loginAuthenticator,
        AUTHENTICATOR_TYPE.JWT,
      );
      console.log(
        "[useIframeSession] Started login via AuthStateManager:",
        loginAuthenticator.substring(0, 20) + "...",
      );
    }

    // Store session for this origin
    SessionManager.setSession(
      currentOrigin,
      sessionJwt,
      sessionToken || "",
      extractedAddress || undefined,
      authenticatorIndex ?? undefined,
    );

    if (extractedAddress) {
      setAddressByOrigin((prev) => ({
        ...prev,
        [currentOrigin]: extractedAddress,
      }));
      onAuthenticatedRef.current?.(extractedAddress);
    }
  }, [session, currentOrigin, stytch, trigger, isDisconnecting, startLogin]);

  // Handle session expiry
  useEffect(() => {
    // Don't process during disconnect
    if (isDisconnecting) return;

    if (!session && currentOrigin) {
      const hasLocalSession = SessionManager.getSession(currentOrigin);
      if (hasLocalSession) {
        console.warn(
          "[useIframeSession] Session expired, clearing local session",
        );
        SessionManager.clearSession(currentOrigin);
        // Also logout from AuthStateManager to clear account state
        AuthStateManager.logout();
        setAddressByOrigin((prev) => {
          const updated = { ...prev };
          delete updated[currentOrigin];
          return updated;
        });
      }
    }
  }, [session, currentOrigin, isDisconnecting]);

  const getAddressForOrigin = useCallback(
    (origin: string) => addressByOrigin[origin] || null,
    [addressByOrigin],
  );

  const clearSessionForOrigin = useCallback(
    async (origin: string) => {
      SessionManager.clearSession(origin);
      setAddressByOrigin((prev) => {
        const updated = { ...prev };
        delete updated[origin];
        return updated;
      });

      // Revoke Stytch session if available
      try {
        // Check if we have a session before trying to revoke
        const tokens = stytch?.session?.getTokens();
        if (tokens) {
          await stytch.session.revoke();
        }
      } catch (error) {
        // Ignore 401 errors as it means we're already logged out
        // Log other errors
        console.warn("[useIframeSession] Error revoking session:", error);
      }
    },
    [stytch],
  );

  return {
    addressByOrigin,
    setAddressByOrigin,
    getAddressForOrigin,
    clearSessionForOrigin,
  };
}
