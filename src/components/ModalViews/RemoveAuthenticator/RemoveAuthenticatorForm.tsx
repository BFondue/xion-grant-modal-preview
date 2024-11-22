import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import {
  AccountWalletLogo,
  Button,
  EmailIcon,
  EthereumLogo,
  PasskeyIcon,
} from "../../ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../../AbstraxionContext";
import { useAbstraxionSigningClient } from "../../../hooks";
import type { authenticatorTypes } from "../../../types";
import { Authenticator } from "../../../indexer-strategies/types";
import { AAAlgo } from "../../../signers";
import { removeRegistration } from "../../../utils/webauthn-utils";
import { Loading } from "../../Loading";

export function RemoveAuthenticatorForm({
  authenticator,
  setIsOpen,
}: {
  authenticator?: Authenticator;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
  // General UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Context state
  const { abstractAccount, setAbstractAccount } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  // Hooks
  const { client } = useAbstraxionSigningClient();

  const handleAuthenticatorLabels = (type: authenticatorTypes) => {
    switch (type) {
      case "SECP256K1":
        return "OKX WALLET";
      case "ETHWALLET":
        return "EVM WALLET";
      case "JWT":
        return "EMAIL";
      case "PASSKEY":
        return "PASSKEY";
      default:
        return "";
    }
  };

  const handleAuthenticatorLogos = (type: authenticatorTypes) => {
    switch (type) {
      case "SECP256K1":
        return (
          <img
            className="ui-invert"
            src="https://www.okx.com/cdn/assets/imgs/239/4A66953783FC5452.png"
            height={24}
            width={24}
            alt="OKX Logo"
          />
        );
      case "ETHWALLET":
        return <EthereumLogo />;
      case "JWT":
        return <EmailIcon />;
      case "PASSKEY":
        return <PasskeyIcon />;
      default:
        return <AccountWalletLogo />;
    }
  };

  const renderAuthenticator = () => {
    if (!authenticator) {
      return (
        <div className="ui-flex ui-items-center ui-px-4 ui-mb-3 ui-h-16 ui-bg-black ui-rounded-lg">
          No authenticator found.
        </div>
      );
    }
    return (
      <div
        key={authenticator.authenticator}
        className="ui-flex ui-items-center ui-px-4 ui-mb-3 ui-h-16 ui-bg-black ui-rounded-lg"
      >
        <div className="ui-flex ui-w-10 ui-h-10 ui-bg-white/20 ui-items-center ui-justify-center ui-rounded-full">
          {handleAuthenticatorLogos(
            authenticator.type.toUpperCase() as authenticatorTypes,
          )}
        </div>
        <div className="ui-ml-4 ui-flex ui-flex-1 ui-items-center ui-justify-between">
          <p className="ui-text-white ui-text-base ui-font-normal ui-font-akkuratLL ui-leading-normal">
            {handleAuthenticatorLabels(
              authenticator.type.toUpperCase() as authenticatorTypes,
            )}
          </p>
        </div>
      </div>
    );
  };

  async function removeAuthenticator() {
    try {
      setIsLoading(true);

      if (!authenticator) {
        throw new Error("No authenticator found.");
      }

      if (!client) {
        throw new Error("No client found.");
      }

      if (!abstractAccount) {
        throw new Error("No account found.");
      }

      if (abstractAccount.authenticators.length <= 1) {
        throw new Error(
          "You are trying to remove the only authenticator on the account and will lose all access. We cannot allow this operation.",
        );
      }

      const msg = {
        remove_auth_method: {
          id: authenticator.authenticatorIndex,
        },
      };

      const res = await client.removeAbstractAccountAuthenticator(msg, "");

      if (res?.rawLog?.includes("failed")) {
        throw new Error("Transaction failed");
      }

      setAbstractAccount({
        ...abstractAccount,
        authenticators: abstractAccount.authenticators.filter(
          ({ id }) =>
            id != `${abstractAccount.id}-${authenticator.authenticatorIndex}`,
        ),
      });

      if (authenticator.type === AAAlgo.Passkey) {
        removeRegistration(abstractAccount.id, authenticator.authenticator);
      }

      setIsLoading(false);
      setIsOpen(false);

      return res;
    } catch (error) {
      console.warn(error);
      setErrorMessage("Something went wrong trying to remove authenticator");
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Loading
        header="REMOVING AUTHENTICATOR..."
        message="We are removing an authenticator from your account. Don't leave the page or close the window. This will take a few seconds..."
      />
    );
  }

  return (
    <div className="ui-p-0 md:ui-p-8 ui-flex ui-flex-col ui-gap-8 ui-items-center">
      <div className="ui-flex ui-flex-col ui-gap-4 ui-w-full">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          ARE YOU SURE?
        </h1>
        {errorMessage ? (
          <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-red-500">
            {errorMessage}
          </p>
        ) : (
          <>
            <div>
              <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
                You are about to delete the authenticator below.
              </p>
              <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
                Please click the confirm button to proceed.
              </p>
            </div>
            {renderAuthenticator()}
          </>
        )}
      </div>
      {errorMessage ? (
        <Button fullWidth onClick={() => setIsOpen(false)}>
          CONTINUE
        </Button>
      ) : (
        <Button fullWidth onClick={removeAuthenticator}>
          CONFIRM
        </Button>
      )}
    </div>
  );
}
