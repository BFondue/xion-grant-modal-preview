import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useStytch } from "@stytch/react";
import {
  AAClient,
  AADirectSigner,
  AAEthSigner,
  AbstractAccountJWTSigner,
} from "../signers";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../components/AbstraxionContext";
import { testnetChainInfo } from "@burnt-labs/constants";
import { AAPasskeySigner } from "../signers/signers/passkey-signer";
import { formatGasPrice, getGasCalculation } from "../utils/gas-utils";
import { STYTCH_PROXY_URL } from "../config";

export const useAbstraxionSigningClient = () => {
  const { connectionType, abstractAccount, chainInfo, isChainInfoLoading } =
    useContext(AbstraxionContext) as AbstraxionContextProps;

  const stytch = useStytch();
  
  // Get session token from Stytch SDK - the single source of truth
  const sessionToken = stytch.session.getTokens()?.session_token;

  const [abstractClient, setAbstractClient] = useState<AAClient | undefined>(
    undefined,
  );

  // track Keplr state changes
  const [keplrState, setKeplrState] = useState(window.keplr ? true : false);

  useEffect(() => {
    const handleKeplrChange = () => {
      setKeplrState(window.keplr ? true : false);
    };

    window.addEventListener("keplr_keystorechange", handleKeplrChange);
    return () => {
      window.removeEventListener("keplr_keystorechange", handleKeplrChange);
    };
  }, []);

  async function okxSignArb(
    chainId: string,
    account: string,
    signBytes: string | Uint8Array,
  ) {
    if (!window.okxwallet?.keplr) {
      throw new Error("Please install the OKX wallet extension");
    }
    await window.okxwallet.keplr.enable(chainInfo?.chainId || "");
    const signDataNew = typeof signBytes === 'string' 
      ? signBytes 
      : Uint8Array.from(Object.values(signBytes));
    return window.okxwallet.keplr.signArbitrary(chainId, account, signDataNew);
  }

  async function ethSigningFn(msg: any) {
    const accounts = await window.ethereum?.request({
      method: "eth_requestAccounts",
    }) as any;
    return window.ethereum?.request({
      method: "personal_sign",
      params: [msg, accounts[0]],
    }) as Promise<string>;
  }

  const getSigner = useCallback(async () => {
    if (isChainInfoLoading || !chainInfo || !abstractAccount) {
      return;
    }

    let signer:
      | AbstractAccountJWTSigner
      | AADirectSigner
      | AAEthSigner
      | AAPasskeySigner
      | undefined = undefined;

    switch (connectionType) {
      case "stytch":
        {
          // Use Stytch proxy API, remove trailing /v1 if present since jwt-signer adds it
          let stytchApiUrl = STYTCH_PROXY_URL.replace(/\/v1$/, '');
          
          signer = new AbstractAccountJWTSigner(
            abstractAccount.id,
            abstractAccount.currentAuthenticatorIndex,
            sessionToken,
            stytchApiUrl,
          );
        }
        break;
      case "shuttle":
        if (window.keplr) {
          const offlineSigner = window.keplr.getOfflineSigner(
            chainInfo.chainId,
          );
          signer = new AADirectSigner(
            offlineSigner,
            abstractAccount.id,
            abstractAccount.currentAuthenticatorIndex,
            window.keplr.signArbitrary,
          );
        }
        break;
      case "okx":
        if (window.okxwallet?.keplr) {
          const okxOfflineSigner = window.okxwallet.keplr.getOfflineSigner(
            chainInfo.chainId,
          );
          signer = new AADirectSigner(
            okxOfflineSigner,
            abstractAccount.id,
            abstractAccount.currentAuthenticatorIndex,
            okxSignArb,
          );
        }
        break;
      case "metamask":
        if (window.ethereum) {
          signer = new AAEthSigner(
            abstractAccount.id,
            abstractAccount.currentAuthenticatorIndex,
            ethSigningFn,
          );
        }
        break;
      case "passkey":
        signer = new AAPasskeySigner(
          abstractAccount.id,
          abstractAccount.currentAuthenticatorIndex,
        );
        break;
      case "none":
        signer = undefined;
        break;
    }

    if (!signer) {
      console.warn("No signer found");
      return;
    }

    const abstractClient = await AAClient.connectWithSigner(
      // Should be set in the context but defaulting here just in case.
      chainInfo.rpc || testnetChainInfo.rpc,
      signer,
      {
        gasPrice: formatGasPrice(chainInfo),
      },
    );

    setAbstractClient(abstractClient);
  }, [
    sessionToken,
    abstractAccount,
    connectionType,
    chainInfo,
    isChainInfoLoading,
    keplrState,
  ]);

  useEffect(() => {
    if (abstractAccount && !isChainInfoLoading) {
      getSigner();
    }
  }, [abstractAccount, isChainInfoLoading, keplrState]);

  const memoizedClient = useMemo(
    () => ({
      client: abstractClient,
      getGasCalculation: (simmedGas: number) =>
        chainInfo ? getGasCalculation(simmedGas, chainInfo) : undefined,
    }),
    [abstractClient, chainInfo],
  );

  return memoizedClient;
};
