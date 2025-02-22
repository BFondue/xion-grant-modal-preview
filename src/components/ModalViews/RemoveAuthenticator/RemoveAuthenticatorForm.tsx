import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import {
  AccountWalletLogo,
  BaseButton,
  CosmosLogo,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { getGasCalculation } from "../../../utils/gas-utils";
import { getEnvStringOrThrow } from "../../../utils";
import { validateFeeGrant } from "../../../utils/validate-fee-grant";

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
  const [showEmailWarning, setShowEmailWarning] = useState(
    authenticator?.type.toUpperCase() === "JWT" ? true : false,
  );

  // Context state
  const { abstractAccount, setAbstractAccount, chainInfo } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  // Hooks
  const { client } = useAbstraxionSigningClient();

  const handleAuthenticatorLabels = (type: authenticatorTypes) => {
    switch (type) {
      case "SECP256K1":
        return "Cosmos Wallet";
      case "ETHWALLET":
        return "EVM Wallet";
      case "JWT":
        return "Email";
      case "PASSKEY":
        return "Passkey";
      default:
        return "";
    }
  };

  const handleAuthenticatorLogos = (type: authenticatorTypes) => {
    switch (type) {
      case "SECP256K1":
        return <CosmosLogo />;
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
        className="ui-flex ui-items-center ui-justify-between ui-px-4 ui-py-5 ui-min-h-16 ui-bg-black/50 ui-rounded-xl ui-w-full"
      >
        <div className="ui-flex ui-flex-1 ui-items-center">
          <div className="ui-flex ui-w-8 ui-h-8 ui-bg-[#434040] ui-items-center ui-justify-center ui-rounded-full">
            {handleAuthenticatorLogos(
              authenticator.type.toUpperCase() as authenticatorTypes,
            )}
          </div>
          <div className="ui-flex ui-flex-1 ui-pr-1 ui-items-start md:!ui-items-center ui-flex-col-reverse md:!ui-flex-row">
            <div className="ui-ml-4 ui-flex ui-items-center ui-justify-between">
              <p className="ui-text-base">
                {handleAuthenticatorLabels(
                  authenticator.type.toUpperCase() as authenticatorTypes,
                )}
              </p>
            </div>
          </div>
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

      const removeMsg: MsgExecuteContractEncodeObject = {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: abstractAccount.id,
          contract: abstractAccount.id,
          msg: new Uint8Array(Buffer.from(JSON.stringify(msg), "utf-8")),
          funds: [],
        }),
      };
      // Check if fee grant exists
      const feeGranterAddress = getEnvStringOrThrow(
        "VITE_FEE_GRANTER_ADDRESS",
        import.meta.env.VITE_FEE_GRANTER_ADDRESS,
      );
      const isValidFeeGrant = await validateFeeGrant(
        chainInfo.rest,
        feeGranterAddress,
        abstractAccount.id,
        [
          "/cosmos.authz.v1beta1.MsgGrant",
          "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
          "/cosmwasm.wasm.v1.MsgExecuteContract",
          "/cosmwasm.wasm.v1.MsgMigrateContract",
        ],
        abstractAccount.id,
      );

      const validFeeGranter = isValidFeeGrant ? feeGranterAddress : null;

      const simmedGas = await client.simulate(
        abstractAccount.id,
        [removeMsg],
        "add-authenticator",
        validFeeGranter,
      );
      const fee = getGasCalculation(simmedGas);

      const deliverTxResponse = await client.signAndBroadcast(
        abstractAccount.id,
        [removeMsg],
        validFeeGranter ? { ...fee, granter: validFeeGranter } : fee,
      );

      assertIsDeliverTxSuccess(deliverTxResponse);

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

      return deliverTxResponse;
    } catch (error) {
      console.warn(error);
      setErrorMessage("Something went wrong trying to remove authenticator");
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Loading
        header="Removing Authenticator"
        message="We are removing an authenticator from your account. Don't leave the page or close the window. This will take a few seconds..."
      />
    );
  }

  if (showEmailWarning) {
    return (
      <div className="ui-flex ui-flex-col ui-gap-12 ui-items-center">
        <DialogHeader>
          <DialogTitle>Warning</DialogTitle>
          {errorMessage ? (
            <DialogDescription className="ui-text-destructive-text">
              {errorMessage}
            </DialogDescription>
          ) : (
            <DialogDescription className="ui-text-white/50">
              Once you delete your email authenticator, you won&apos;t be able
              to add it back. That feature is coming soon.
            </DialogDescription>
          )}
        </DialogHeader>
        <BaseButton
          onClick={() => setShowEmailWarning(false)}
          variant="destructive"
          className="ui-w-full"
        >
          I ACKNOWLEDGE & WISH TO PROCEED
        </BaseButton>
      </div>
    );
  }

  return (
    <div className="ui-flex ui-flex-col ui-gap-8 ui-items-center ui-w-full">
      <DialogHeader>
        <DialogTitle>Are you sure?</DialogTitle>
        {errorMessage ? (
          <DialogDescription className="ui-text-destructive-text">
            {errorMessage}
          </DialogDescription>
        ) : (
          <>
            <div>
              <DialogDescription>
                You are about to delete the authenticator below.
              </DialogDescription>
              <DialogDescription>
                Please click the confirm button to proceed.
              </DialogDescription>
            </div>
          </>
        )}
      </DialogHeader>
      {renderAuthenticator()}
      {errorMessage ? (
        <BaseButton className="ui-w-full" onClick={() => setIsOpen(false)}>
          CONTINUE
        </BaseButton>
      ) : (
        <BaseButton className="ui-w-full" onClick={removeAuthenticator}>
          CONFIRM
        </BaseButton>
      )}
    </div>
  );
}
