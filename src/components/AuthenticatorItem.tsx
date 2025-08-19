import React, { useState, useMemo, memo } from "react";
import { User } from "@stytch/vanilla-js";
import { EyeIcon, EyeOffIcon, TrashIcon } from "./ui";
import { Authenticator } from "../indexer-strategies/types";
import type { authenticatorTypes } from "../types";
import {
  capitalizeFirstLetter,
  getAuthenticatorLabel,
  getAuthenticatorLogo,
  extractUserIdFromAuthenticator,
  isEmailAuthenticator,
  getUserEmail,
} from "../auth/utils/authenticator-helpers";

interface AuthenticatorItemProps {
  authenticator: Authenticator;
  currentAuthenticatorIndex: number;
  isMainnet: boolean;
  onRemove: (authenticator: Authenticator) => void;
  user: User | null;
  authType?: string;
}

const AuthenticatorItemComponent: React.FC<AuthenticatorItemProps> = ({
  authenticator,
  currentAuthenticatorIndex,
  isMainnet,
  onRemove,
  user,
  authType,
}) => {
  const [showEmail, setShowEmail] = useState(false);

  const isCurrentAuthenticator = useMemo(
    () => currentAuthenticatorIndex === authenticator.authenticatorIndex,
    [currentAuthenticatorIndex, authenticator.authenticatorIndex],
  );

  const userId = useMemo(
    () =>
      extractUserIdFromAuthenticator(
        authenticator.authenticator,
        authenticator.type,
      ),
    [authenticator.authenticator, authenticator.type],
  );

  const isEmailAuth = useMemo(
    () => isEmailAuthenticator(authenticator.type, authType),
    [authenticator.type, authType],
  );

  const authenticatorLabel = useMemo(
    () =>
      capitalizeFirstLetter(authType) ||
      getAuthenticatorLabel(
        authenticator.type.toUpperCase() as authenticatorTypes,
      ),
    [authType, authenticator.type],
  );

  const email = useMemo(
    () => (isEmailAuth ? getUserEmail(user, userId) : ""),
    [isEmailAuth, user, userId],
  );

  const logo = useMemo(
    () =>
      getAuthenticatorLogo(
        authenticator.type.toUpperCase() as authenticatorTypes,
        authType,
      ),
    [authenticator.type, authType],
  );

  const handleToggleEmail = () => {
    setShowEmail((prev) => !prev);
  };

  const handleRemove = () => {
    onRemove(authenticator);
  };

  return (
    <div className="ui-flex ui-items-center ui-justify-between ui-px-4 ui-py-5 ui-min-h-16 ui-bg-black/50 ui-rounded-xl">
      <div className="ui-flex ui-flex-1 ui-items-center">
        <div className="ui-flex ui-w-8 ui-h-8 ui-bg-[#434040] ui-items-center ui-justify-center ui-rounded-full">
          {logo}
        </div>
        <div className="ui-flex ui-flex-1 ui-pr-1 ui-items-start md:!ui-items-center ui-flex-col-reverse md:!ui-flex-row">
          {!(isEmailAuth && showEmail && isCurrentAuthenticator) && (
            <div className="ui-ml-4 ui-flex ui-items-center ui-justify-between">
              <p className="ui-text-base">{authenticatorLabel}</p>
            </div>
          )}
          {isEmailAuth && showEmail && isCurrentAuthenticator && email && (
            <div className="ui-ml-4 ui-flex ui-items-center ui-max-w-full ui-justify-between">
              <p className="ui-text-secondary-text ui-break-all ui-max-w-full ui-text-base">
                {email}
              </p>
            </div>
          )}
          {isCurrentAuthenticator && (
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
        {isEmailAuth && isCurrentAuthenticator && email && (
          <button
            className="ui-text-white"
            onClick={handleToggleEmail}
            aria-label={showEmail ? "Hide email" : "Show email"}
          >
            {showEmail ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
        {!isCurrentAuthenticator && (
          <button
            className="ui-text-white"
            onClick={handleRemove}
            aria-label="Remove authenticator"
          >
            <TrashIcon className="ui-w-4 ui-h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export const AuthenticatorItem = memo(AuthenticatorItemComponent);
