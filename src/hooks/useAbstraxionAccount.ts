import { useContext, useEffect, useMemo, useState } from "react";
import { useShuttle } from "@delphi-labs/shuttle-react";
import { useStytch, useStytchSession } from "@stytch/react";
import {
  AbstraxionContext,
  AbstraxionContextProps,
  ConnectionType,
} from "../components/AbstraxionContext";
import { decodeJwt } from "jose";

interface OkxAccount {
  account: {
    juno: string;
    iris: string;
    axl: string;
    stars: string;
    kava: string;
    kuji: string;
    sei: string;
    inj: string;
    cosmoshub: string;
    osmosis: string;
    dydx: string;
    tia: string;
    XION_TEST: string;
  };
  name: string;
}

export const useAbstraxionAccount = () => {
  const { session } = useStytchSession();

  const {
    connectionType,
    setConnectionType,
    abstractAccount,
    setAbstractAccount,
  } = useContext(AbstraxionContext) as AbstraxionContextProps;

  // Should we confirm the value is indeed a ConnectionType?
  const loginType = localStorage.getItem("loginType") as ConnectionType;
  const [loginAuthenticator, setLoginAuthenticator] = useState(
    localStorage.getItem("loginAuthenticator"),
  );

  const updateAbstractAccountCodeId = async (codeId: number) => {
    const newAccount = {
      ...abstractAccount,
      codeId,
    };
    setAbstractAccount(newAccount);
  };

  const { recentWallet } = useShuttle();
  const stytchClient = useStytch();
  const session_jwt = stytchClient.session.getTokens()?.session_jwt;

  function getAuthenticator() {
    let authenticator = "";
    const shuttleAccount = recentWallet?.account;
    switch (connectionType) {
      case "stytch": {
        const { aud, sub } = session_jwt
          ? decodeJwt(session_jwt)
          : { aud: undefined, sub: undefined };
        authenticator = `${Array.isArray(aud) ? aud[0] : aud}.${sub}`;
        break;
      }
      case "shuttle":
        authenticator = shuttleAccount?.pubkey || loginAuthenticator || "";
        break;
      case "metamask":
        authenticator = loginAuthenticator || "";
        break;
      case "okx":
        authenticator = loginAuthenticator || "";
        break;
      case "passkey":
        authenticator = loginAuthenticator || "";
        break;
      case "none":
        authenticator = "";
        break;
    }

    return authenticator;
  }

  const loginAuthenticatorMemo = useMemo(
    () => getAuthenticator(),
    [connectionType, session_jwt, recentWallet, loginAuthenticator],
  );

  useEffect(() => {
    const refreshConnectionType = () => {
      setConnectionType(loginType || "none");
    };

    if (connectionType === "none") {
      refreshConnectionType();
    }
  }, [session, recentWallet, connectionType, loginType]);

  // Metamask & OKX account detection
  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (connectionType === "metamask") {
        localStorage.setItem("loginAuthenticator", accounts[0]);
        setLoginAuthenticator(accounts[0]);
        setAbstractAccount(undefined);
      }
    };

    window.ethereum?.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum?.off("accountsChanged", handleAccountsChanged);
    };
  }, []);

  // OKX account detection
  useEffect(() => {
    const handleAccountsChanged = async (accounts: OkxAccount) => {
      if (connectionType === "okx") {
        const okxXionAddress = localStorage.getItem("okxXionAddress");
        const okxWalletName = localStorage.getItem("okxWalletName");

        // If user switches account via extension, log user out.
        // No good way to handle account switch via the OKX keplr event system
        if (
          okxXionAddress !== accounts.account.XION_TEST ||
          okxWalletName !== accounts.name
        ) {
          // Basically log out
          setConnectionType("none");
          setAbstractAccount(undefined);
          localStorage.removeItem("loginType");
          localStorage.removeItem("loginAuthenticator");
          localStorage.removeItem("okxXionAddress");
          localStorage.removeItem("okxWalletName");
        }
      }
    };

    if (window.okxwallet) {
      window.okxwallet?.keplr.on("connect", handleAccountsChanged);
    }

    return () => {
      window.okxwallet?.keplr.off("connect", handleAccountsChanged);
    };
  }, []);

  // Keplr account detection
  useEffect(() => {
    const handleAccountsChanged = () => {
      if (connectionType === "shuttle") {
        setAbstractAccount(undefined);
      }
    };

    window.addEventListener("keplr_keystorechange", handleAccountsChanged);
    return () => {
      window.removeEventListener("keplr_keystorechange", handleAccountsChanged);
    };
  }, []);

  return {
    updateAbstractAccountCodeId,
    data: abstractAccount || undefined,
    connectionType,
    loginAuthenticator: loginAuthenticatorMemo,
    isConnected:
      connectionType === "stytch"
        ? !!session
        : connectionType === "shuttle"
          ? !!recentWallet
          : connectionType === "metamask"
            ? window.ethereum.isConnected()
            : connectionType === "okx"
              ? !!localStorage.getItem("loginAuthenticator")
              : connectionType === "passkey"
                ? !!localStorage.getItem("loginAuthenticator")
                : false,
  };
};
