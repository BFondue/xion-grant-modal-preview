import React, { Dispatch, SetStateAction, useContext, useState } from "react";
import { MsgExecuteContractEncodeObject } from "@cosmjs/cosmwasm-stargate";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import {
  AccountWalletLogo,
  Button,
  CosmosLogo,
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
        header="REMOVING AUTHENTICATOR..."
        message="We are removing an authenticator from your account. Don't leave the page or close the window. This will take a few seconds..."
      />
    );
  }

  if (showEmailWarning) {
    return (
      <div className="ui-p-0 md:ui-p-8 ui-flex ui-flex-col ui-gap-12 ui-items-center">
        <div className="ui-flex ui-flex-col ui-gap-3 ui-w-full">
          <h1 className="ui-w-full ui-text-center ui-text-[32px] ui-leading-[120%] ui-font-thin">
            WARNING
          </h1>
          {errorMessage ? (
            <p className="ui-w-full ui-text-center ui-text-sm ui-text-red-500">
              {errorMessage}
            </p>
          ) : (
            <>
              <div>
                <p className="ui-w-full ui-text-center ui-text-base  ui-text-white/50">
                  Once you delete your email authenticator, you won&apos;t be
                  able to add it back. That feature is coming soon.
                </p>
              </div>
            </>
          )}
        </div>
        <Button
          fullWidth
          onClick={() => setShowEmailWarning(false)}
          structure="destructive"
        >
          I ACKNOWLEDGE & WISH TO PROCEED
        </Button>
      </div>
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
