import React, { useCallback, useContext, useState } from "react";
import { useStytch } from "@stytch/react";
import { Button, Spinner } from "@burnt-labs/ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { truncateAddress } from "../../utils";
import { useAbstraxionAccount } from "../../hooks";
import { Loading } from "../Loading";
import { WalletIcon } from "../Icons";
import { useXionDisconnect } from "../../hooks/useXionDisconnect";
import { useNumiaSmartAccounts } from "../../hooks/useNumiaSmartAccounts";

export const AbstraxionWallets = () => {
  const {
    connectionType,
    abstractAccount,
    setAbstractAccount,
    setAbstraxionError,
    apiUrl,
    setIsOpen,
  } = useContext(AbstraxionContext) as AbstraxionContextProps;

  const stytchClient = useStytch();
  const session_jwt = stytchClient.session.getTokens()?.session_jwt;
  const session_token = stytchClient.session.getTokens()?.session_token;

  const { loginAuthenticator } = useAbstraxionAccount();
  const { data, loading, error, startPolling } = useNumiaSmartAccounts(
    false,
    () => {
      setIsGeneratingNewWallet(false);
    },
  );
  const { xionDisconnect } = useXionDisconnect();

  const [isGeneratingNewWallet, setIsGeneratingNewWallet] = useState(false);

  const handleJwtAALoginOrCreate = useCallback(async () => {
    try {
      setIsGeneratingNewWallet(true);
      const res = await fetch(`${apiUrl}/api/v1/jwt-accounts/create`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          salt: Date.now().toString(),
          session_jwt,
          session_token,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error);
      }
    } catch (error) {
      console.log(error);
      setAbstraxionError("Error creating abstract account.");
    } finally {
      startPolling(3000);
    }
  }, [
    apiUrl,
    session_jwt,
    session_token,
    setIsGeneratingNewWallet,
    setAbstraxionError,
  ]);

  if (error) {
    setAbstraxionError("Failed to fetch accounts");
    return null;
  }

  return (
    <>
      {isGeneratingNewWallet ? (
        <Loading />
      ) : (
        <div className="ui-flex ui-h-full ui-w-full ui-flex-col ui-items-start ui-justify-between ui-gap-8 sm:ui-p-10 ui-text-white">
          <div className="ui-flex ui-flex-col ui-w-full ui-text-center">
            <h1 className="ui-font-akkuratLL ui-w-full ui-leading-[38.40px] ui-tracking-tighter ui-text-3xl ui-font-light ui-text-white ui-uppercase ui-mb-3">
              Welcome
            </h1>
            <h2 className="ui-font-akkuratLL ui-w-full ui-mb-4 ui-text-center ui-text-sm ui-font-normal ui-leading-tight ui-text-white/50">
              Choose an account to continue
            </h2>
          </div>
          <div className="ui-flex ui-w-full ui-flex-col ui-items-start ui-justify-center ui-gap-4">
            <div className="ui-text-white ui-text-base ui-font-bold ui-font-akkuratLL ui-leading-tight">
              Accounts
            </div>
            <div className="ui-flex ui-max-h-64 ui-w-full ui-flex-col ui-items-center ui-gap-4 ui-overflow-auto">
              {loading ? (
                <Spinner />
              ) : data?.length >= 1 ? (
                data?.map((node, i: number) => (
                  <div
                    className={`ui-w-full ui-items-center ui-gap-4 ui-rounded-lg ui-p-6 ui-flex ui-bg-transparent hover:ui-cursor-pointer ui-border-[1px] ui-border-white hover:ui-bg-white/5 ${
                      node.id === abstractAccount?.id
                        ? ""
                        : "ui-border-opacity-30"
                    }`}
                    key={i}
                    onClick={() => {
                      setAbstractAccount({
                        authenticators: node.authenticators,
                        id: node.id,
                        codeId: node.codeId,
                        currentAuthenticatorIndex: node.authenticators.find(
                          (authenticator) =>
                            authenticator.authenticator === loginAuthenticator,
                        ).authenticatorIndex,
                      });
                      setIsOpen(false);
                    }}
                  >
                    <WalletIcon color="white" backgroundColor="#363635" />
                    <div className="ui-flex ui-flex-col ui-gap-1">
                      <h1 className="ui-text-sm ui-font-bold ui-font-akkuratLL ui-leading-none">
                        Personal Account {i + 1}
                      </h1>
                      <h2 className="ui-text-xs ui-text-neutral-400 ui-font-akkuratLL ui-leading-tight">
                        {truncateAddress(node.id)}
                      </h2>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <p>No Accounts Found.</p>
                  {connectionType !== "stytch" ? (
                    <p className="ui-text-center ui-text-neutral-400">
                      This authenticator can only be used as a backup right now.
                      Please log in with email to create an account.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <div className="ui-flex ui-w-full ui-flex-col ui-items-center ui-gap-4">
            {!loading && data?.length < 1 && connectionType === "stytch" ? (
              <Button
                structure="outlined"
                fullWidth={true}
                onClick={handleJwtAALoginOrCreate}
              >
                Create your first account now!
              </Button>
            ) : null}
            <Button
              structure="destructive-outline"
              fullWidth={true}
              onClick={xionDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
