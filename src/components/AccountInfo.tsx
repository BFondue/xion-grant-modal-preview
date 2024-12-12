import React, { useContext, useState, useEffect } from "react";
import {
  AccountWalletLogo,
  Button,
  CopyIcon,
  CosmosLogo,
  EmailIcon,
  EthereumLogo,
  EyeIcon,
  EyeOffIcon,
  PasskeyIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TrashIcon,
} from "./ui";
import { useStytchUser } from "@stytch/react";
import { truncateAddress } from "../utils";
import RemoveAuthenticatorModal from "./ModalViews/RemoveAuthenticator/RemoveAuthenticatorModal";
import type { authenticatorTypes } from "../types";
import AddAuthenticatorsModal from "./ModalViews/AddAuthenticators/AddAuthenticatorsModal";
import { Authenticator } from "../indexer-strategies/types";
import { AbstraxionMigrate } from "./AbstraxionMigrate";
import { AbstraxionContext } from "./AbstraxionContext";

export const AccountInfo = ({
  updateContractCodeID,
}: {
  updateContractCodeID: (codeId: number) => void;
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  const copyXIONAddress = () => {
    if (abstractAccount?.id) {
      navigator.clipboard.writeText(abstractAccount?.id);
    }
  };

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
          className="ui-flex ui-items-center ui-justify-between ui-px-4 ui-py-2 ui-mb-3 ui-min-h-16 ui-bg-black ui-rounded-lg"
        >
          <div className="ui-flex ui-flex-1 ui-items-center">
            <div className="ui-flex ui-w-10 ui-h-10 ui-bg-white/20 ui-items-center ui-justify-center ui-rounded-full">
              {handleAuthenticatorLogos(
                authenticator.type.toUpperCase() as authenticatorTypes,
              )}
            </div>
            <div className="ui-flex ui-flex-1 ui-pr-1 ui-items-start md:!ui-items-center ui-flex-col-reverse md:!ui-flex-row">
              {authenticator.type === "Jwt" &&
              showUserEmail &&
              currentAuthenticator ? null : (
                <div className="ui-ml-4 ui-flex ui-items-center ui-justify-between">
                  <p className="ui-text-white ui-text-base ui-font-normal ui-font-akkuratLL ui-leading-normal">
                    {handleAuthenticatorLabels(
                      authenticator.type.toUpperCase() as authenticatorTypes,
                    )}
                  </p>
                </div>
              )}
              {showUserEmail && currentAuthenticator && (
                <div className="ui-ml-4 ui-flex ui-items-center ui-max-w-full ui-justify-between">
                  <p className="ui-text-[#6C6A6A] ui-break-all ui-max-w-full ui-text-base ui-font-normal ui-font-akkuratLL ui-leading-normal">
                    {email}
                  </p>
                </div>
              )}
              {currentAuthenticator && (
                <div
                  className={`ui-ml-4 ui-p-1 ui-rounded ui-flex ui-border ${
                    isMainnet ? "ui-border-mainnet-bg" : "ui-border-testnet-bg"
                  }`}
                >
                  <p
                    className={`${
                      isMainnet ? "ui-text-mainnet" : "ui-text-testnet"
                    } ui-text-xs ui-whitespace-nowrap ui-font-normal ui-font-akkuratLL ui-leading-normal`}
                  >
                    Active Session
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="ui-flex ui-items-center">
            {authenticator.type === "Jwt" && currentAuthenticator && (
              <button
                className="ui-text-white ui-mr-4"
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
              <TrashIcon />
            </button>
          </div>
        </div>
      );
    });
  };
  return (
    <div className="ui-bg-white/10 ui-p-6 ui-rounded-2xl">
      <h3 className="ui-text-white ui-text-sm ui-font-bold ui-font-akkuratLL ui-leading-none ui-mb-6">
        XION Address
      </h3>
      <div
        onClick={copyXIONAddress}
        className="ui-flex ui-cursor-pointer ui-items-center ui-justify-between ui-mb-10 ui-px-4 ui-w-full ui-h-16 ui-bg-black ui-rounded-lg"
      >
        <p className="ui-text-white ui-text-base ui-font-normal ui-font-akkuratLL ui-leading-normal">
          {truncateAddress(abstractAccount?.id)}
        </p>
        <Popover>
          <PopoverTrigger>
            <CopyIcon color="white" />
          </PopoverTrigger>
          <PopoverContent>
            <p>Copied!</p>
          </PopoverContent>
        </Popover>
      </div>
      <div className="ui-flex">
        <div className="ui-flex ui-flex-1 ui-flex-col">
          <div className="ui-flex ui-items-center ui-justify-between ui-mb-6">
            <h3 className="ui-text-white ui-text-sm ui-font-bold ui-font-akkuratLL ui-leading-none">
              Your Logins
            </h3>
            <Button
              className="!ui-p-0"
              onClick={() => setIsAddModalOpen(true)}
              structure="naked"
            >
              Add more
            </Button>
            <AddAuthenticatorsModal
              isOpen={isAddModalOpen}
              setIsOpen={setIsAddModalOpen}
            />
          </div>
          {renderAuthenticators()}
        </div>
        {/* TODO: Add history components */}
        {/* <div className="flex flex-1 flex-col"></div> */}
      </div>
      <AbstraxionMigrate
        currentCodeId={abstractAccount.codeId}
        updateContractCodeID={updateContractCodeID}
      />
      <RemoveAuthenticatorModal
        isOpen={isRemoveModalOpen}
        setIsOpen={setIsRemoveModalOpen}
        authenticator={authenticatorToRemove}
      />
    </div>
  );
};
