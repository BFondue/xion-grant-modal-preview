import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useStytch } from "@stytch/react";
import { decodeJwt } from "jose";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { truncateAddress } from "../../utils";
import { useAbstraxionAccount } from "../../hooks";
import { useXionDisconnect } from "../../hooks/useXionDisconnect";
import { useGetSmartAccountsStrategy } from "../../hooks/useGetSmartAccountsStrategy";
import {
  BaseButton,
  CloseIcon,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  NavigationButton,
} from "../ui";
import { ErrorDisplay } from "../ErrorDisplay";
import { cn } from "../../utils/classname-util";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import { ChevronRightIcon } from "../ui/icons/ChevronRight";
import { InboxIcon } from "../ui/icons/Inbox";
import SadIcon from "../ui/icons/Sad";
import { useQueryParams } from "../../hooks/useQueryParams";
import { safeRedirectOrDisconnect } from "../../utils/redirect-utils";
import {
  deduplicateAccountsById,
  findBestMatchingAuthenticator,
} from "../../utils/authenticator-utils";

export const AbstraxionWallets = () => {
  const {
    connectionType,
    abstractAccount,
    setAbstractAccount,
    abstraxionError,
    setAbstraxionError,
    apiUrl,
    setIsOpen,
    isInGrantFlow,
  } = useContext(AbstraxionContext) as AbstraxionContextProps;

  const { redirect_uri, state } = useQueryParams(["redirect_uri", "state"]);
  const isInLoginFlow = !abstractAccount;

  const stytchClient = useStytch();
  const session_jwt = stytchClient.session.getTokens()?.session_jwt;
  const session_token = stytchClient.session.getTokens()?.session_token;

  const { loginAuthenticator } = useAbstraxionAccount();
  const { data, loading, error } = useGetSmartAccountsStrategy(false, () => {
    setIsGeneratingNewWallet(false);
  });
  const { xionDisconnect } = useXionDisconnect();

  const [isGeneratingNewWallet, setIsGeneratingNewWallet] = useState(false);
  const [shouldAutoNavigate, setShouldAutoNavigate] = useState(false);

  // Deduplicate accounts by ID to prevent showing the same account multiple times
  const uniqueAccounts = useMemo(() => deduplicateAccountsById(data), [data]);

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

      // Use the account_address and code_id directly from the response
      const { account_address, code_id } = body;

      // Create the authenticator data
      const { aud, sub } = session_jwt
        ? decodeJwt(session_jwt)
        : { aud: undefined, sub: undefined };
      const authenticator = `${Array.isArray(aud) ? aud[0] : aud}.${sub}`;

      // Set the abstract account directly
      setAbstractAccount({
        id: account_address,
        codeId: code_id,
        authenticators: [
          {
            id: `${account_address}-0`,
            type: "Jwt",
            authenticator,
            authenticatorIndex: 0,
          },
        ],
        currentAuthenticatorIndex: 0,
      });

      // Only close the modal if not in grant flow (grant flow will show permissions next)
      if (!isInGrantFlow) {
        setIsOpen(false);
      }
    } catch (error) {
      console.log(error);
      setAbstraxionError("Error creating abstract account.");
      setShouldAutoNavigate(false); // Reset auto-navigation on error
    } finally {
      setIsGeneratingNewWallet(false);
    }
  }, [
    apiUrl,
    session_jwt,
    session_token,
    setIsGeneratingNewWallet,
    setAbstraxionError,
    setAbstractAccount,
    setIsOpen,
    isInGrantFlow,
    setShouldAutoNavigate,
  ]);

  // Handle auto-navigation for 0 or 1 account scenarios
  useEffect(() => {
    if (
      isInLoginFlow &&
      !loading &&
      !isGeneratingNewWallet &&
      !abstraxionError
    ) {
      if (uniqueAccounts.length === 1) {
        // Auto-select the single account
        const node = uniqueAccounts[0];

        // Find the best matching authenticator (handles duplicates)
        const authenticatorToUse = findBestMatchingAuthenticator(
          node.authenticators,
          loginAuthenticator,
        );

        if (authenticatorToUse) {
          setAbstractAccount({
            ...node,
            currentAuthenticatorIndex: authenticatorToUse.authenticatorIndex,
          });
          setShouldAutoNavigate(true);
          // Only close modal if not in grant flow (grant flow will show permissions next)
          if (!isInGrantFlow) {
            setIsOpen(false);
          }
        }
      } else if (uniqueAccounts.length === 0 && connectionType === "stytch") {
        // Auto-create account for users with no accounts
        setShouldAutoNavigate(true);
        handleJwtAALoginOrCreate();
      }
    }
  }, [
    uniqueAccounts,
    loading,
    isGeneratingNewWallet,
    isInLoginFlow,
    loginAuthenticator,
    setAbstractAccount,
    connectionType,
    handleJwtAALoginOrCreate,
    isInGrantFlow,
    setIsOpen,
    abstraxionError,
  ]);

  const dialogTitle = useMemo(() => {
    if (isGeneratingNewWallet) return "Creating Account";
    if (loading || shouldAutoNavigate) return "Fetching Accounts";
    return "Accounts";
  }, [isGeneratingNewWallet, loading, shouldAutoNavigate]);

  const dialogDescription = useMemo(() => {
    if (isGeneratingNewWallet) return "This will take a few seconds";
    if (loading || shouldAutoNavigate) return "Loading your accounts";
    return "Choose an account to continue";
  }, [isGeneratingNewWallet, loading, shouldAutoNavigate]);

  const handleDisconnectClick = () => {
    // Only disconnect if there's no redirect_uri (button is labeled "DISCONNECT")
    // If there is a redirect_uri (button is labeled "CANCEL"), just redirect without disconnecting
    safeRedirectOrDisconnect(
      redirect_uri,
      setAbstraxionError,
      xionDisconnect,
      undefined,
      !redirect_uri,
      state || undefined,
    );
  };

  if (error) {
    return (
      <ErrorDisplay
        title="Failed to fetch accounts"
        description="There was an error fetching your accounts. Please try reloading the page."
        onClose={() => {
          setAbstraxionError("");
          xionDisconnect();
        }}
      />
    );
  }

  return (
    <div className="ui-flex ui-h-full ui-w-full ui-flex-col ui-items-start ui-justify-center ui-gap-12">
      {!isInLoginFlow && (
        <DialogClose className="ui-absolute ui-top-6 ui-right-6">
          <CloseIcon strokeWidth={2} className="ui-w-4 ui-h-4" />
        </DialogClose>
      )}
      <DialogHeader>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogDescription>{dialogDescription}</DialogDescription>
      </DialogHeader>
      <div className="ui-flex ui-w-full ui-flex-col ui-items-start ui-justify-center ui-gap-4">
        <div
          className="ui-flex ui-max-h-[19rem] ui-w-full ui-flex-col ui-items-center ui-gap-3 ui-overflow-auto"
          role="region"
          aria-label={dialogTitle}
        >
          {loading || isGeneratingNewWallet || shouldAutoNavigate ? (
            <SpinnerV2
              size="lg"
              color="white"
              aria-label={
                isGeneratingNewWallet
                  ? "Creating account..."
                  : "Loading accounts..."
              }
            />
          ) : uniqueAccounts.length >= 1 ? (
            uniqueAccounts.map((node, i: number) => (
              <NavigationButton
                className={cn("ui-w-full", {
                  "ui-border-opacity-30": node.id === abstractAccount?.id,
                })}
                // We are appending 'i' to deal with the case where a user
                // has the same authenticator twice on the same meta account.
                key={`${node.id}-${i}`}
                subLabel={
                  <div className="ui-bg-white/10 ui-px-1.5 ui-py-0.5 ui-rounded-[4px] ui-text-xs ui-font-bold">
                    <span className="ui-text-white/80">
                      {truncateAddress(node.id)}
                    </span>
                  </div>
                }
                onClick={() => {
                  // Find the best matching authenticator (handles duplicates)
                  const authenticatorToUse =
                    findBestMatchingAuthenticator(
                      node.authenticators,
                      loginAuthenticator,
                    ) || node.authenticators[0]; // Fallback to first authenticator

                  setAbstractAccount({
                    authenticators: node.authenticators,
                    id: node.id,
                    codeId: node.codeId,
                    currentAuthenticatorIndex:
                      authenticatorToUse.authenticatorIndex,
                  });
                  setIsOpen(false);
                }}
                aria-label={`Select Personal Account ${i + 1}`}
              >
                Personal Account {i + 1}
              </NavigationButton>
            ))
          ) : (
            <>
              {connectionType === "stytch" ? (
                <>
                  <div className="ui-flex ui-items-center ui-justify-center ui-w-full ui-h-full">
                    <InboxIcon aria-hidden="true" />
                  </div>
                  <p
                    className="ui-font-bold ui-text-xl ui-leading-6"
                    role="status"
                  >
                    No accounts found
                  </p>
                </>
              ) : (
                <div className="ui-flex ui-flex-col ui-items-center ui-justify-center ui-gap-5 ui-px-8">
                  <SadIcon aria-hidden="true" />
                  <p
                    className="ui-text-center ui-font-bold ui-text-base ui-leading-[19.2px]"
                    role="status"
                  >
                    This authenticator can only be used as a backup right now.
                    Please log in with email or social account to create an
                    account.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="ui-flex ui-w-full ui-flex-col ui-items-center ui-gap-4">
        <DialogFooter>
          <div className="ui-flex ui-flex-col ui-gap-3 ui-w-full">
            {connectionType === "stytch" &&
              isInLoginFlow &&
              !shouldAutoNavigate && (
                <BaseButton
                  className="ui-w-full"
                  onClick={handleJwtAALoginOrCreate}
                  disabled={
                    loading ||
                    isGeneratingNewWallet ||
                    uniqueAccounts.length > 0
                  }
                >
                  CREATE NEW ACCOUNT
                </BaseButton>
              )}
            <div className="ui-flex ui-gap-3 ui-w-full">
              {isInLoginFlow && isInGrantFlow && (
                <BaseButton
                  variant="secondary"
                  size="icon-large"
                  className="ui-group/basebutton"
                  disabled={loading || isGeneratingNewWallet}
                  onClick={xionDisconnect}
                >
                  <div className="ui-flex ui-items-center ui-justify-center">
                    <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
                    <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
                  </div>
                </BaseButton>
              )}
              <BaseButton
                variant="destructive"
                className="ui-w-full"
                disabled={loading || isGeneratingNewWallet}
                onClick={handleDisconnectClick}
              >
                {redirect_uri ? "CANCEL" : "DISCONNECT"}
              </BaseButton>
            </div>
          </div>
        </DialogFooter>
      </div>
    </div>
  );
};
