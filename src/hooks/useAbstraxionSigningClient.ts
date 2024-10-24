import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useStytch } from "@stytch/react";
import {
  AAClient,
  AADirectSigner,
  AAEthSigner,
  AbstractAccountJWTSigner,
  GasPrice,
} from "../signers";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../components/AbstraxionContext";
import { getKeplr, useOfflineSigners } from "graz";
import { testnetChainInfo } from "@burnt-labs/constants";
import { getEnvStringOrThrow } from "../utils";

export const useAbstraxionSigningClient = () => {
  const { connectionType, abstractAccount, chainInfo } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const stytch = useStytch();
  const sessionToken = stytch.session.getTokens()?.session_token;

  const { data } = useOfflineSigners();
  const keplr = window.keplr ? getKeplr() : undefined;

  const [abstractClient, setAbstractClient] = useState<AAClient | undefined>(
    undefined,
  );

  async function okxSignArb(
    chainId: string,
    account: string,
    signBytes: Uint8Array,
  ) {
    if (!window.okxwallet) {
      alert("Please install the OKX wallet extension");
      return;
    }
    await window.okxwallet.keplr.enable(chainInfo.chainId);
    const signDataNew = Uint8Array.from(Object.values(signBytes));
    return window.okxwallet.keplr.signArbitrary(chainId, account, signDataNew);
  }

  async function ethSigningFn(msg) {
    const accounts = await window.ethereum?.request({
      method: "eth_requestAccounts",
    });
    return window.ethereum?.request<string>({
      method: "personal_sign",
      params: [msg, accounts[0]],
    });
  }

  const getSigner = useCallback(async () => {
    let signer:
      | AbstractAccountJWTSigner
      | AADirectSigner
      | AAEthSigner
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
      case "graz":
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
        gasPrice: GasPrice.fromString("0uxion"),
      },
    );

    setAbstractClient(abstractClient);
  }, [sessionToken, abstractAccount, connectionType, data, keplr]);

  useEffect(() => {
    if (abstractAccount) {
      getSigner();
    }
  }, [abstractAccount]);

  const memoizedClient = useMemo(
    () => ({ client: abstractClient }),
    [abstractClient],
  );

  return memoizedClient;
};
