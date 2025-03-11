import React, { useContext, useState, useEffect } from "react";
import {
  AccountWalletLogo,
  CosmosLogo,
  EmailIcon,
  EthereumLogo,
  EyeIcon,
  EyeOffIcon,
  PasskeyIcon,
  TrashIcon,
  BaseButton,
  CloseIcon,
} from "./ui";
import { useStytchUser } from "@stytch/react";
import RemoveAuthenticatorModal from "./ModalViews/RemoveAuthenticator/RemoveAuthenticatorModal";
import type { authenticatorTypes } from "../types";
import AddAuthenticatorsModal from "./ModalViews/AddAuthenticators/AddAuthenticatorsModal";
import { Authenticator } from "../indexer-strategies/types";
import { AbstraxionContext } from "./AbstraxionContext";
import { cn } from "../utils/classname-util";

export const AccountInfo = () => {
  const [, setIsAddModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [authenticatorToRemove, setAuthenticatorToRemove] = useState<
    Authenticator | undefined
  >();
  const [showUserEmail, setShowUserEmail] = useState(false);
  const { isMainnet, abstractAccount, setAbstractAccount } =
    useContext(AbstraxionContext);
  const { user } = useStytchUser();

  // This effect is meant to handle the situation where the stytch session
  // changes after adding a new JWT authenticator.
  useEffect(() => {
    if (user && abstractAccount) {
      const activeJwtAuthenticator = abstractAccount.authenticators.find(
        (authenticator) =>
          authenticator.type === "Jwt" &&
          user.user_id ===
            pullUserIdFromAuthenticator(authenticator.authenticator),
      );
      if (
        activeJwtAuthenticator &&
        abstractAccount.currentAuthenticatorIndex !==
          activeJwtAuthenticator.authenticatorIndex
      ) {
        setAbstractAccount({
          ...abstractAccount,
          currentAuthenticatorIndex: activeJwtAuthenticator.authenticatorIndex,
        });
      }
    }
  }, [user, abstractAccount, setAbstractAccount]);

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
        return <CosmosLogo className="ui-w-4 ui-h-4" />;
      case "ETHWALLET":
        return <EthereumLogo className="ui-w-4 ui-h-4" />;
      case "JWT":
        return <EmailIcon className="ui-w-4 ui-h-4" />;
      case "PASSKEY":
        return <PasskeyIcon />;
      default:
        return <AccountWalletLogo />;
    }
  };

  function pullUserIdFromAuthenticator(authenticator: string) {
    const [, userId] = authenticator.split(".");
    return userId;
  }

  const renderAuthenticators = () => {
    return abstractAccount?.authenticators.map((authenticator) => {
      const currentAuthenticator =
        abstractAccount?.currentAuthenticatorIndex ===
        authenticator.authenticatorIndex;

      let email = "";

      if (authenticator.type === "Jwt" && user) {
        if (
          user.user_id ===
          pullUserIdFromAuthenticator(authenticator.authenticator)
        ) {
          email = user.emails[0]?.email;
        }
      }

      return (
        <div
          key={authenticator.id}
          className="ui-flex ui-items-center ui-justify-between ui-px-4 ui-py-5 ui-min-h-16 ui-bg-black/50 ui-rounded-xl"
        >
          <div className="ui-flex ui-flex-1 ui-items-center">
            <div className="ui-flex ui-w-8 ui-h-8 ui-bg-[#434040] ui-items-center ui-justify-center ui-rounded-full">
              {handleAuthenticatorLogos(
                authenticator.type.toUpperCase() as authenticatorTypes,
              )}
            </div>
            <div className="ui-flex ui-flex-1 ui-pr-1 ui-items-start md:!ui-items-center ui-flex-col-reverse md:!ui-flex-row">
              {authenticator.type === "Jwt" &&
              showUserEmail &&
              currentAuthenticator ? null : (
                <div className="ui-ml-4 ui-flex ui-items-center ui-justify-between">
                  <p className="ui-text-base">
                    {handleAuthenticatorLabels(
                      authenticator.type.toUpperCase() as authenticatorTypes,
                    )}
                  </p>
                </div>
              )}
              {showUserEmail && currentAuthenticator && (
                <div className="ui-ml-4 ui-flex ui-items-center ui-max-w-full ui-justify-between">
                  <p className="ui-text-secondary-text ui-break-all ui-max-w-full ui-text-base">
                    {email}
                  </p>
                </div>
              )}
              {currentAuthenticator && (
                <div
                  className={`ui-ml-3 ui-px-1.5 ui-py-[1px] ui-rounded-sm ui-flex ui-border ${
                    isMainnet ? "ui-border-mainnet-bg" : "ui-border-testnet-bg"
                  }`}
                >
                  <p
                    className={`${
                      isMainnet ? "ui-text-mainnet" : "ui-text-testnet"
                    } ui-text-xs ui-whitespace-nowrap ui-leading-[20px]`}
                  >
                    Active Session
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="ui-flex ui-items-center ui-gap-4">
            {authenticator.type === "Jwt" && currentAuthenticator && (
              <button
                className="ui-text-white"
                onClick={() => {
                  setShowUserEmail(!showUserEmail);
                }}
              >
                {showUserEmail ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            )}
            <button
              className="ui-text-white"
              onClick={() => {
                setAuthenticatorToRemove(authenticator);
                setIsRemoveModalOpen(true);
              }}
            >
              <TrashIcon className="ui-w-4 ui-h-4" />
            </button>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="ui-bg-[#262626] ui-p-6 ui-rounded-xl">
      <div className="ui-flex ui-flex-col ui-gap-[42px]">
        <div className="ui-flex">
          <div className="ui-flex ui-flex-1 ui-flex-col ui-gap-5">
            <div className="ui-flex ui-items-center ui-justify-between">
              <h3 className="ui-leading-[24px] ui-text-lg md:ui-text-xl ui-font-bold">
                Your Authenticators
              </h3>
              <AddAuthenticatorsModal
                trigger={
                  <BaseButton
                    size="small"
                    onClick={() => setIsAddModalOpen(true)}
                    className={cn(
                      "ui-h-fit ui-w-fit ui-min-w-fit ui-gap-1 ui-font-bold ui-bg-transparent ui-rounded-lg ui-border ui-border-border ui-text-white/60",
                      "hover:ui-text-white hover:ui-bg-white/[0.05] ui-transition-all ui-duration-300",
                      "ui-px-1.5 ui-py-1 ui-text-xs md:ui-px-2.5 md:ui-py-1.5 md:ui-text-base",
                    )}
                  >
                    <CloseIcon
                      strokeWidth={3}
                      className="ui-w-2.5 ui-h-2.5 md:ui-w-3 md:ui-h-3 ui-rotate-45"
                    />
                    Add more
                  </BaseButton>
                }
              />
            </div>
            <div className="ui-flex ui-flex-col ui-gap-5">
              {renderAuthenticators()}
            </div>
          </div>
          {/* TODO: Add history components */}
          {/* <div className="flex flex-1 flex-col"></div> */}
        </div>
      </div>

      <RemoveAuthenticatorModal
        isOpen={isRemoveModalOpen}
        setIsOpen={setIsRemoveModalOpen}
        authenticator={authenticatorToRemove}
      />
    </div>
  );
};
