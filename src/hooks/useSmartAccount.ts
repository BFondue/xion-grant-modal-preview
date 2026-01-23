/**
 * useSmartAccount - Hook for accessing the current XION account
 *
 * This hook has been simplified to use AuthStateManager as the single source of truth.
 * The previous implementation had 3 separate useEffects to sync localStorage with state,
 * which was complex and error-prone.
 *
 * Now:
 * - State comes from useAuthState() which wraps AuthStateManager
 * - No more manual localStorage sync - AuthStateManager handles it
 * - Simplified isConnected logic using a lookup table instead of nested ternaries
 * - Wallet change detection still handled here (MetaMask, OKX, Keplr events)
 */

import { useEffect, useMemo } from "react";
import { useShuttle } from "@delphi-labs/shuttle-react";
import { useStytchSession } from "@stytch/react";
import { useAuthState, CONNECTION_METHOD } from "../auth/useAuthState";
import { AUTHENTICATOR_TYPE } from "@burnt-labs/signers";

export const useSmartAccount = () => {
  const { session } = useStytchSession();
  const { recentWallet } = useShuttle();

  // Use unified auth state - this is now the source of truth
  const {
    connectionMethod,
    account,
    authenticator,
    authenticatorType,
    isConnected: authStateIsConnected,
    updateAccount,
    logout,
    startLogin,
  } = useAuthState();

  // Note: Context syncing is handled by AuthContextProvider's subscription
  // to AuthStateManager. We don't need to sync here - that would cause double updates.

  // Update abstract account code ID
  const updateAbstractAccountCodeId = async (codeId: number) => {
    if (account) {
      const newAccount = { ...account, codeId };
      updateAccount(newAccount);
    }
  };

  // --- Wallet Change Detection ---

  // Metamask account change detection
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (
        connectionMethod === CONNECTION_METHOD.Metamask &&
        accounts.length > 0
      ) {
        // Account changed - need to reset and re-authenticate
        console.log("[useSmartAccount] MetaMask account changed:", accounts[0]);
        // Clear the current account so user needs to re-login
        logout(window.location.origin);
      }
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum?.off("accountsChanged", handleAccountsChanged);
    };
  }, [connectionMethod, logout]);

  // OKX account change detection
  // When OKX wallet fires a "connect" event, it means the user switched accounts
  // We should log them out so they can re-authenticate with the new account
  useEffect(() => {
    const handleAccountsChanged = async () => {
      if (connectionMethod === CONNECTION_METHOD.OKX) {
        console.log("[useSmartAccount] OKX wallet event detected, logging out");
        await logout(window.location.origin);
      }
    };

    if (window.okxwallet) {
      window.okxwallet?.keplr.on("connect", handleAccountsChanged);
    }

    return () => {
      window.okxwallet?.keplr.off("connect", handleAccountsChanged);
    };
  }, [connectionMethod, logout]);

  // Keplr account change detection
  useEffect(() => {
    const handleAccountsChanged = () => {
      if (connectionMethod === CONNECTION_METHOD.Keplr) {
        console.log(
          "[useSmartAccount] Keplr account changed, clearing account",
        );
        // Clear account so it gets re-fetched with new key
        if (account) {
          updateAccount({ ...account, id: "" } as any);
        }
      }
    };

    window.addEventListener("keplr_keystorechange", handleAccountsChanged);
    return () => {
      window.removeEventListener("keplr_keystorechange", handleAccountsChanged);
    };
  }, [connectionMethod, account, updateAccount]);

  // Shuttle/Keplr wallet connection - update authenticator when wallet connects
  useEffect(() => {
    if (
      connectionMethod === CONNECTION_METHOD.Keplr &&
      recentWallet &&
      !authenticator
    ) {
      // Wallet connected via Shuttle, use the pubkey string directly
      // Note: .pubkey is already a base64 string, not .pubKey which is Uint8Array
      const walletAuthenticator = recentWallet.account?.pubkey;
      if (walletAuthenticator) {
        console.log(
          "[useSmartAccount] Shuttle wallet connected, setting authenticator:",
          walletAuthenticator,
        );
        startLogin(
          AUTHENTICATOR_TYPE.Secp256K1,
          CONNECTION_METHOD.Keplr,
          walletAuthenticator,
        );
      }
    }
  }, [connectionMethod, recentWallet, authenticator, startLogin]);

  // --- Compute isConnected ---
  // Simplified from nested ternary to a clear lookup
  const isConnected = useMemo(() => {
    // If AuthStateManager says we're connected with an account, we're connected
    if (authStateIsConnected) {
      return true;
    }

    // Fallback checks during the connecting phase (before account is loaded)
    switch (connectionMethod) {
      case "stytch":
        return !!session;
      case "keplr":
        return !!recentWallet;
      case "metamask":
        return window.ethereum?.isConnected?.() ?? false;
      case "okx":
      case "passkey":
        return !!authenticator;
      case "none":
      default:
        return false;
    }
  }, [
    authStateIsConnected,
    connectionMethod,
    session,
    recentWallet,
    authenticator,
  ]);

  return {
    updateAbstractAccountCodeId,
    data: account,
    connectionMethod,
    loginAuthenticator: authenticator,
    loginAuthenticatorType: authenticatorType,
    isConnected,
  };
};
