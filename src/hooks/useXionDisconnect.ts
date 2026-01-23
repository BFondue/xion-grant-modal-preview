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
import { useShuttle } from "@delphi-labs/shuttle-react";
import { useAuthState, CONNECTION_METHOD } from "../auth/useAuthState";

export function useXionDisconnect() {
  const { disconnect } = useShuttle();
  const stytch = useStytch();
  const { logout, connectionMethod } = useAuthState();

  const xionDisconnect = async () => {
    // Disconnect Shuttle wallet if that's the connection type
    if (connectionMethod === CONNECTION_METHOD.Keplr) {
      try {
        disconnect();
      } catch (error) {
        console.warn("[useXionDisconnect] Error disconnecting shuttle:", error);
      }
    }

    // Delegate all cleanup to AuthStateManager
    // This handles:
    // - Revoking Stytch session (if stytch connection)
    // - Clearing localStorage (loginType, loginAuthenticator, okx data)
    // - Clearing sessionStorage (origin session)
    // - Notifying parent window
    // - Resetting state
    await logout(window.location.origin, stytch);
  };

  return { xionDisconnect };
}
