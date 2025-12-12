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
import { getEnvStringOrThrow, getEthWalletAddress } from "../utils";
import { AAPasskeySigner } from "../signers/signers/passkey-signer";
import { formatGasPrice, getGasCalculation } from "../utils/gas-utils";

export const useAbstraxionSigningClient = () => {
  const { connectionType, abstractAccount, chainInfo, isChainInfoLoading } =
    useContext(AbstraxionContext) as AbstraxionContextProps;

  const stytch = useStytch();
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
    signBytes: Uint8Array,
  ) {
    if (!window.okxwallet) {
      alert("Please install the OKX wallet extension");
      return;
    }
    await window.okxwallet.keplr.enable(chainInfo?.chainId || "");
    const signDataNew = Uint8Array.from(Object.values(signBytes));
    return window.okxwallet.keplr.signArbitrary(chainId, account, signDataNew);
  }

  async function ethSigningFn(msg) {
    const ethAddress = await getEthWalletAddress();
    return window.ethereum?.request<string>({
      method: "personal_sign",
      params: [msg, ethAddress],
    });
  }

  const getSigner = useCallback(async () => {
    if (isChainInfoLoading || !chainInfo) {
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
        signer = new AbstractAccountJWTSigner(
          abstractAccount.id,
          abstractAccount.currentAuthenticatorIndex,
          sessionToken,
          //  @TODO Will need to find a better pattern eventually
          abstractAccount.codeId === 21
            ? getEnvStringOrThrow(
                "VITE_DEFAULT_API_URL",
                import.meta.env.VITE_DEFAULT_API_URL,
              )
            : getEnvStringOrThrow(
                "VITE_NEW_CONTRACT_API_URL",
                import.meta.env.VITE_NEW_CONTRACT_API_URL,
              ),
        );
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
        if (window.okxwallet) {
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
