/**
 * useXionDisconnect - Hook for disconnecting from XION auth
 *
 * This hook provides a simple disconnect function that delegates
 * all cleanup to the AuthStateManager.
 *
 * Previously this hook contained duplicate logout logic that was
 * also present in IframeApp.handleDisconnect. Now all logout logic
 * is centralized in AuthStateManager.logout().
 */

import { useStytch } from "@stytch/react";
import { useAuthState } from "../auth/useAuthState";

export function useXionDisconnect() {
  const stytch = useStytch();
  const { logout } = useAuthState();

  const xionDisconnect = async () => {
    // Delegate all cleanup to AuthStateManager
    // This handles:
    // - Revoking Stytch session (if stytch connection)
    // - Clearing localStorage (loginAuthenticator, okx data)
    // - Clearing sessionStorage (origin session)
    // - Notifying parent window
    // - Resetting state
    await logout(window.location.origin, stytch);
  };

  return { xionDisconnect };
}
