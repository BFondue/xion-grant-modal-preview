import { useCallback, useContext, useEffect, useMemo, useState } from "react";
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
import {
  createAccountWithMetaMask,
  createAccountWithCosmosWallet,
} from "../../hooks";
import { getErrorMessageForUI, WalletAccountError } from "../../utils";
import { AAAlgo } from "../../signers";

export const AbstraxionWallets = () => {
  const {
    connectionType,
    setConnectionType,
    abstractAccount,
    setAbstractAccount,
    abstraxionError,
    setAbstraxionError,
    apiUrl,
    chainInfo,
    setIsOpen,
    isInGrantFlow,
  } = useContext(AbstraxionContext) as AbstraxionContextProps;

  const { redirect_uri, state } = useQueryParams(["redirect_uri", "state"]);
  const isInLoginFlow = !abstractAccount;

  const stytchClient = useStytch();
  const session_jwt = stytchClient.session.getTokens()?.session_jwt;
  const session_token = stytchClient.session.getTokens()?.session_token;

  const { loginAuthenticator } = useAbstraxionAccount();
  const { data, loading, error, retry } = useGetSmartAccountsStrategy(
    false,
    () => {
      setIsGeneratingNewWallet(false);
    },
  );
  const { xionDisconnect } = useXionDisconnect();

  const [isGeneratingNewWallet, setIsGeneratingNewWallet] = useState(false);
  const [shouldAutoNavigate, setShouldAutoNavigate] = useState(false);

  // Deduplicate accounts by ID to prevent showing the same account multiple times
  const uniqueAccounts = useMemo(() => deduplicateAccountsById(data), [data]);

  const handleJwtAALoginOrCreate = useCallback(async () => {
    try {
      setIsGeneratingNewWallet(true);
      const res = await fetch(`${apiUrl}/api/v2/accounts/create/jwt`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
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
      let authenticator = "";
      if (session_jwt) {
        try {
          const { aud, sub } = decodeJwt(session_jwt);
          if (aud && sub) {
            authenticator = `${Array.isArray(aud) ? aud[0] : aud}.${sub}`;
          }
        } catch (e) {
          console.warn("[AbstraxionWallets] Failed to decode JWT:", e);
        }
      }

      if (!authenticator) {
        throw new Error("Failed to extract authenticator from JWT");
      }

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

      // Only close the modal if not in grant flow
      // (grant flow will show permissions dialog next)
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

  const handleExternalWalletAALoginOrCreate = useCallback(
    async (walletType: "metamask" | "keplr" | "okx" | "leap") => {
      try {
        setIsGeneratingNewWallet(true);
        setAbstraxionError("");

        if (!chainInfo) {
          throw new Error("Chain information not loaded");
        }

        let result;
        let walletInfo;

        // Create account based on wallet type
        if (walletType === "metamask") {
          const accountData = await createAccountWithMetaMask(apiUrl);
          result = accountData;
          walletInfo = accountData.walletInfo;
        } else {
          // For Cosmos wallets (keplr, okx, leap)
          const walletName =
            walletType === "okx"
              ? "okx"
              : walletType === "leap"
                ? "leap"
                : "keplr";
          const accountData = await createAccountWithCosmosWallet(
            apiUrl,
            chainInfo.chainId,
            walletName,
          );
          result = accountData;
          walletInfo = accountData.walletInfo;
        }

        // Set the abstract account with the correct authenticator type
        const authenticatorType =
          walletInfo.type === "EthWallet" ? AAAlgo.ETHWALLET : AAAlgo.secp256k1;

        // Store the authenticator identifier in localStorage for indexer queries
        localStorage.setItem("loginAuthenticator", walletInfo.identifier);

        // Map wallet type to connection type (keplr and leap both use "shuttle")
        const connType =
          walletType === "keplr" || walletType === "leap"
            ? "shuttle"
            : walletType;
        localStorage.setItem("loginType", connType);

        // Update connection type to trigger state updates
        setConnectionType(connType);

        setAbstractAccount({
          id: result.accountAddress,
          codeId: result.codeId,
          authenticators: [
            {
              id: `${result.accountAddress}-0`,
              type: authenticatorType,
              authenticator: walletInfo.identifier,
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
        console.error("Error creating wallet account:", error);

        // Use simple error message for UI
        const userMessage =
          error instanceof WalletAccountError
            ? error.userMessage
            : getErrorMessageForUI(error);

        setAbstraxionError(userMessage);
        setShouldAutoNavigate(false);
      } finally {
        setIsGeneratingNewWallet(false);
      }
    },
    [
      apiUrl,
      chainInfo?.chainId,
      setIsGeneratingNewWallet,
      setAbstraxionError,
      setAbstractAccount,
      setIsOpen,
      isInGrantFlow,
      setShouldAutoNavigate,
    ],
  );

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
          loginAuthenticator || "",
        );

        if (authenticatorToUse) {
          setAbstractAccount({
            ...node,
            currentAuthenticatorIndex: authenticatorToUse.authenticatorIndex,
          });
          setShouldAutoNavigate(true);
          // Only close modal if not in grant flow
          // (grant flow will show permissions dialog next)
          if (!isInGrantFlow) {
            setIsOpen(false);
          }
        }
      } else if (uniqueAccounts.length === 0) {
        // Auto-create account for users with no accounts
        if (connectionType === "stytch") {
          setShouldAutoNavigate(true);
          handleJwtAALoginOrCreate();
        } else if (
          connectionType === "metamask" ||
          connectionType === "shuttle" ||
          connectionType === "okx"
        ) {
          // Auto-create account for wallet-based connections
          setShouldAutoNavigate(true);
          const walletType =
            connectionType === "metamask"
              ? "metamask"
              : connectionType === "shuttle"
                ? "keplr"
                : "okx";
          handleExternalWalletAALoginOrCreate(walletType);
        }
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
    handleExternalWalletAALoginOrCreate,
    isInGrantFlow,
    setIsOpen,
    abstraxionError,
  ]);

  const dialogTitle = useMemo(() => {
    if (isGeneratingNewWallet) return "Creating Account";
    if (loading || shouldAutoNavigate) return "Fetching Accounts";
    if (error) return "Connection Error";
    return "Accounts";
  }, [isGeneratingNewWallet, loading, shouldAutoNavigate, error]);

  const dialogDescription = useMemo(() => {
    if (isGeneratingNewWallet) return "This will take a few seconds";
    if (loading || shouldAutoNavigate)
      return "Querying the indexer for your accounts...";
    if (error) return "Failed to connect to the indexer";
    if (uniqueAccounts.length === 0) return "No accounts found on the network";
    return "Choose an account to continue";
  }, [
    isGeneratingNewWallet,
    loading,
    shouldAutoNavigate,
    error,
    uniqueAccounts.length,
  ]);

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
        description="Unable to connect to the indexer. Please check your connection and try again."
        buttonText="RETRY"
        onButtonClick={() => {
          retry();
        }}
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
            <div className="ui-flex ui-flex-col ui-items-center ui-justify-center ui-py-16">
              <SpinnerV2
                size="lg"
                color="white"
                aria-label={
                  isGeneratingNewWallet
                    ? "Creating account..."
                    : "Loading accounts..."
                }
              />
            </div>
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
                      loginAuthenticator || "",
                    ) || node.authenticators[0]; // Fallback to first authenticator

                  setAbstractAccount({
                    authenticators: node.authenticators,
                    id: node.id,
                    codeId: node.codeId,
                    currentAuthenticatorIndex:
                      authenticatorToUse.authenticatorIndex,
                  });
                  // Only close modal if not in grant flow
                  if (!isInGrantFlow) {
                    setIsOpen(false);
                  }
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
                  <div className="ui-flex ui-flex-col ui-items-center ui-gap-2">
                    <p
                      className="ui-font-bold ui-text-xl ui-leading-6"
                      role="status"
                    >
                      No accounts found
                    </p>
                    <p className="ui-text-sm ui-text-secondary-text ui-text-center">
                      You don&apos;t have any accounts on this network yet
                    </p>
                  </div>
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
      {!(loading || isGeneratingNewWallet || shouldAutoNavigate) && (
        <div className="ui-flex ui-w-full ui-flex-col ui-items-center ui-gap-4">
          <DialogFooter>
            <div className="ui-flex ui-flex-col ui-gap-3 ui-w-full">
              {isInLoginFlow && !shouldAutoNavigate && (
                <BaseButton
                  className="ui-w-full"
                  onClick={() => {
                    if (connectionType === "stytch") {
                      handleJwtAALoginOrCreate();
                    } else if (connectionType === "metamask") {
                      handleExternalWalletAALoginOrCreate("metamask");
                    } else if (connectionType === "shuttle") {
                      handleExternalWalletAALoginOrCreate("keplr");
                    } else if (connectionType === "okx") {
                      handleExternalWalletAALoginOrCreate("okx");
                    }
                  }}
                  disabled={
                    loading ||
                    isGeneratingNewWallet ||
                    uniqueAccounts.length > 0 ||
                    connectionType === "passkey" ||
                    connectionType === "none"
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
                  variant={
                    connectionType !== "stytch" &&
                    uniqueAccounts.length === 0 &&
                    !redirect_uri
                      ? "default"
                      : "destructive"
                  }
                  className="ui-w-full"
                  disabled={loading || isGeneratingNewWallet}
                  onClick={handleDisconnectClick}
                >
                  {redirect_uri ? (
                    "CANCEL"
                  ) : connectionType !== "stytch" &&
                    uniqueAccounts.length === 0 ? (
                    <div className="ui-flex ui-items-center ui-justify-center ui-gap-2">
                      <ChevronRightIcon className="ui-fill-current ui-rotate-180" />
                      BACK TO LOGIN
                    </div>
                  ) : (
                    "DISCONNECT"
                  )}
                </BaseButton>
              </div>
            </div>
          </DialogFooter>
        </div>
      )}
    </div>
  );
};
