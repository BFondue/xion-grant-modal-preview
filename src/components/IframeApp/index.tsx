/**
 * IframeApp - Main iframe component for XION authentication
 *
 * This component has been refactored to use AuthStateManager for cleaner state management.
 * Key simplifications:
 * - Removed complex logout detection useEffect (was lines 214-238)
 * - Removed local isDisconnecting state - uses AuthStateManager.isDisconnecting
 * - Simplified handleDisconnect to delegate to AuthStateManager
 * - Uses useAuthState hook for all auth state access
 */

import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { useStytchSession, useStytch } from "@stytch/react";
import { LoginScreen } from "../LoginScreen";
import { LoginWalletSelector } from "../LoginWalletSelector";
import { AuthContext } from "../AuthContext";
import { Dialog, DialogContent } from "../ui/dialog";
import { SessionManager, getAddressFromJWT } from "../../auth/session";
import AddAuthenticatorsModal from "../ModalViews/AddAuthenticators/AddAuthenticatorsModal";
import RemoveAuthenticatorModal from "../ModalViews/RemoveAuthenticator/RemoveAuthenticatorModal";
import type { Authenticator } from "@burnt-labs/account-management";
import type { StdFee } from "@cosmjs/amino";
import { SigningModal } from "./SigningModal";
import { LoginGrantApproval } from "../LoginGrantApproval";
import { App } from "../App";
import { useSigningClient } from "../../hooks/useSigningClient";
import { useAccountDiscovery } from "../../hooks/useAccountDiscovery";
import {
  useIframeSession,
  useIframeMessageHandler,
  useIframeModals,
  useModalStyling,
} from "./hooks";
import { findBestMatchingAuthenticator } from "../../utils/authenticator-utils";
import { useAuthState, CONNECTION_METHOD } from "../../auth/useAuthState";
import {
  setZKEmailSigningAbortController,
  setZKEmailSigningStatus,
} from "../../auth/zk-email/zk-email-signing-status";
import type {
  ConnectPayload,
  ConnectResponse,
  SignTransactionPayload,
  SignTransactionResponse,
  AddAuthenticatorPayload,
  AddAuthenticatorResponse,
  RemoveAuthenticatorPayload,
  RemoveAuthenticatorResponse,
  RequestGrantPayload,
  RequestGrantResponse,
} from "../../messaging/types";

/**
 * Refactored IframeApp component that leverages AuthStateManager for state management
 */
export function IframeApp({
  isStandalone = false,
}: {
  isStandalone?: boolean;
}) {
  const [currentOrigin, setCurrentOrigin] = useState<string | null>(null);
  const { session } = useStytchSession();
  const stytch = useStytch();

  // Use AuthStateManager via hook - this is now the source of truth
  const {
    account: abstractAccount,
    connectionMethod,
    authenticator: loginAuthenticator,
    isDisconnecting,
    completeLogin,
    logout,
  } = useAuthState();

  // Get context setters for backward compatibility
  const { setAbstractAccount, setConnectionMethod } = useContext(AuthContext);

  const { client: signingClient } = useSigningClient();
  const {
    data: smartAccounts,
    loading: smartAccountsLoading,
    error: smartAccountsError,
  } = useAccountDiscovery();

  // Debug logging for smart accounts
  useEffect(() => {
    console.log("[IframeApp] Smart accounts state:", {
      loginAuthenticator: loginAuthenticator
        ? loginAuthenticator.substring(0, 20) + "..."
        : null,
      connectionMethod,
      smartAccountsCount: smartAccounts?.length || 0,
      smartAccountsLoading,
      smartAccountsError: smartAccountsError?.toString(),
      hasAbstractAccount: !!abstractAccount,
    });
  }, [
    loginAuthenticator,
    connectionMethod,
    smartAccounts,
    smartAccountsLoading,
    smartAccountsError,
    abstractAccount,
  ]);

  // Use custom hooks for cleaner code
  useModalStyling();

  // Initialize modals first
  const modals = useIframeModals();
  const {
    openAuthModal,
    closeAuthModal,
    openSigningModal,
    openAddAuthModal,
    openRemoveAuthModal,
    openGrantModal,
  } = modals;

  // When signing modal is open with zk-email, set abort controller so closing/rejecting stops polling
  useEffect(() => {
    if (
      !modals.showSigningModal ||
      connectionMethod !== CONNECTION_METHOD.ZKEmail
    )
      return;
    setZKEmailSigningStatus(null);
    const controller = new AbortController();
    setZKEmailSigningAbortController(controller);
    return () => {
      controller.abort();
      setZKEmailSigningAbortController(null);
      setZKEmailSigningStatus(null);
    };
  }, [modals.showSigningModal, connectionMethod]);

  // Use ref to avoid stale closure in useIframeSession callback
  const closeAuthModalRef = useRef(closeAuthModal);
  useEffect(() => {
    closeAuthModalRef.current = closeAuthModal;
  }, [closeAuthModal]);

  // Set current origin for standalone context
  useEffect(() => {
    if (!isStandalone && !currentOrigin) {
      // Check if we're in standalone context and set origin
      try {
        if (window.parent && (window.parent as unknown as Record<string, unknown>).__xionSDK !== undefined) {
          setCurrentOrigin(window.location.origin);
        }
      } catch {
        // Ignore cross-origin access errors
      }
    }
  }, [isStandalone, currentOrigin]);

  const { addressByOrigin, setAddressByOrigin, getAddressForOrigin } =
    useIframeSession({
      currentOrigin,
      onAuthenticated: (address) => {
        console.log("[IframeApp] User authenticated, address:", address);
        closeAuthModalRef.current(address);
      },
      isDisconnecting,
    });

  // Auto-trigger auth modal when not logged in (both standalone and iframe mode within StandAloneWrapper)
  useEffect(() => {
    // Check if we're in an iframe that's part of StandAloneWrapper
    // We can detect this by checking if we're same-origin with the parent
    const isSameOrigin = (() => {
      try {
        return window.parent.location.origin === window.location.origin;
      } catch {
        return false;
      }
    })();
    const isInStandaloneIframe =
      !isStandalone && window.parent !== window && isSameOrigin;

    // Wait for state to fully settle - loginAuthenticator should be null AND connectionMethod should be 'none'
    const isFullyLoggedOut =
      !loginAuthenticator && connectionMethod === CONNECTION_METHOD.None;

    if (
      (isStandalone || isInStandaloneIframe) &&
      !session &&
      !abstractAccount &&
      isFullyLoggedOut &&
      !modals.showAuthModal
    ) {
      const timer = setTimeout(() => {
        console.log("[IframeApp] Not logged in - showing auth modal");
        setCurrentOrigin(window.location.origin);
        openAuthModal(() => {
          // No resolver needed for standalone mode
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    isStandalone,
    session,
    abstractAccount,
    loginAuthenticator,
    connectionMethod,
    openAuthModal,
    modals.showAuthModal,
  ]);

  // Sync connection method when we have a session
  useEffect(() => {
    if (session && connectionMethod === CONNECTION_METHOD.None) {
      console.log("[IframeApp] Syncing Stytch session to connection method");
      setConnectionMethod(CONNECTION_METHOD.Stytch);
    }
  }, [session, connectionMethod, setConnectionMethod]);

  // In standalone mode, populate addressByOrigin from abstractAccount
  useEffect(() => {
    if (isStandalone && abstractAccount) {
      const address = abstractAccount.id;

      if (address && !addressByOrigin[window.location.origin]) {
        setAddressByOrigin((prev) => ({
          ...prev,
          [window.location.origin]: address,
        }));
      }
    }
  }, [isStandalone, abstractAccount, addressByOrigin, setAddressByOrigin]);

  // Track if we need to show account selector (multiple accounts)
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  // Populate abstractAccount when smart accounts are fetched
  useEffect(() => {
    if (
      !abstractAccount &&
      smartAccounts &&
      smartAccounts.length > 0 &&
      loginAuthenticator
    ) {
      console.log(
        "[IframeApp] Setting abstractAccount from fetched smart accounts:",
        smartAccounts,
      );

      // If multiple accounts, show the account selector (auth modal stays open but hidden)
      if (smartAccounts.length > 1) {
        console.log(
          "[IframeApp] Multiple accounts found, showing account selector",
        );
        setShowAccountSelector(true);
        // Don't close auth modal - we need to keep the resolver for when account is selected
        return; // Don't auto-select, let user choose
      }

      // Single account - auto-select
      const account = smartAccounts[0];

      // Find the best matching authenticator
      const authenticatorToUse = findBestMatchingAuthenticator(
        account.authenticators,
        loginAuthenticator,
      );

      if (authenticatorToUse) {
        console.log(
          "[IframeApp] Setting abstractAccount with authenticator:",
          authenticatorToUse,
        );
        const fullAccount = {
          ...account,
          currentAuthenticatorIndex: authenticatorToUse.authenticatorIndex,
        };
        // Update through AuthStateManager (this will also update context)
        completeLogin(fullAccount);
      } else {
        console.warn("[IframeApp] No matching authenticator found");
      }
    }
  }, [
    session,
    abstractAccount,
    smartAccounts,
    loginAuthenticator,
    completeLogin,
    setAbstractAccount,
    connectionMethod,
  ]);

  // Close account selector when account is selected
  useEffect(() => {
    if (abstractAccount && showAccountSelector) {
      console.log("[IframeApp] Account selected, closing account selector");
      setShowAccountSelector(false);
    }
  }, [abstractAccount, showAccountSelector]);

  // Close auth modal when abstractAccount is defined (successful login)
  useEffect(() => {
    // If we have an account and the auth modal is open, close it
    // We don't need to check for transitions because if we have an account, we are logged in
    if (abstractAccount && modals.showAuthModal) {
      console.log("[IframeApp] Closing auth modal - account present");
      closeAuthModal(abstractAccount.id);
    }
  }, [abstractAccount, modals.showAuthModal, closeAuthModal]);

  // Listen for authentication session ready message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "AUTH_SESSION_READY") {
        console.log("[IframeApp] Received AUTH_SESSION_READY message");
        // Trigger re-render if needed
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Handle CONNECT request
  const handleConnect = useCallback(
    (origin: string, payload?: ConnectPayload): Promise<ConnectResponse> => {
      console.log(
        "[IframeApp] handleConnect called with origin:",
        origin,
        "payload:",
        payload,
      );
      setCurrentOrigin(origin);

      const handleGrantAfterConnect = (
        address: string,
      ): Promise<ConnectResponse> => {
        if (payload?.grantParams) {
          console.log(
            "[IframeApp] Grant params present, initiating grant flow after connect",
          );
          return new Promise((resolve, reject) => {
            // Let's use the new transitionToModal exposed on modals
            modals.transitionToModal(
              "grant",
              {
                treasuryAddress: payload.grantParams!.treasuryAddress,
                grantee: payload.grantParams!.grantee,
              },
              (result: unknown) => {
                if ((result as { success: boolean }).success) {
                  resolve({ address });
                } else {
                  reject(new Error("Grant denied"));
                }
              },
            );
          });
        }
        return Promise.resolve({ address });
      };

      // Don't process if disconnecting
      if (isDisconnecting) {
        console.log("[IframeApp] Ignoring connect during disconnect");
        return Promise.reject(new Error("Disconnecting"));
      }

      // Check for existing valid session
      const existingSession = SessionManager.getSession(origin);
      if (existingSession && SessionManager.hasValidSession(origin)) {
        const address = getAddressFromJWT(existingSession);
        if (address) {
          console.log("[IframeApp] Found existing session, address:", address);
          return handleGrantAfterConnect(address);
        }
      }

      // Check if already authenticated in memory (abstractAccount is set)
      // But also verify the session is still valid
      if (abstractAccount && session) {
        console.log(
          "[IframeApp] Already have abstractAccount, returning address:",
          abstractAccount.id,
        );
        return handleGrantAfterConnect(abstractAccount.id);
      }

      // Check cached address for this origin
      const cachedAddress = getAddressForOrigin(origin);
      if (cachedAddress && session) {
        console.log("[IframeApp] Found cached address:", cachedAddress);
        return handleGrantAfterConnect(cachedAddress);
      }

      // Not authenticated - show auth modal
      // The modal's resolver will be called when authentication completes
      console.log("[IframeApp] No existing session, showing auth modal");
      return new Promise((resolve, reject) => {
        openAuthModal(async (result: unknown) => {
          const connectResult = result as { address?: string };
          if (connectResult?.address) {
            try {
              const finalResult = await handleGrantAfterConnect(connectResult.address);
              resolve(finalResult);
            } catch (e) {
              reject(e);
            }
          }
        });
      });
    },
    [
      getAddressForOrigin,
      openAuthModal,
      abstractAccount,
      openGrantModal,
      isDisconnecting,
      session,
      modals,
    ],
  );

  // Handle SIGN_TRANSACTION request
  const handleSignTransaction = useCallback(
    (
      origin: string,
      payload: SignTransactionPayload,
    ): Promise<SignTransactionResponse> => {
      setCurrentOrigin(origin);
      return new Promise((resolve) => {
        openSigningModal(payload.transaction, (value: unknown) => resolve(value as SignTransactionResponse));
      });
    },
    [openSigningModal],
  );

  // Handle SIGN_AND_BROADCAST request
  const handleSignAndBroadcast = useCallback(
    (origin: string, payload: SignTransactionPayload): Promise<SignTransactionResponse> => {
      setCurrentOrigin(origin);
      return new Promise((resolve, reject) => {
        openSigningModal(payload.transaction, (result: unknown) => {
          const signingResult = result as { error?: string; signedTx?: unknown };
          if (signingResult.error) {
            reject(new Error(signingResult.error));
          } else {
            resolve(signingResult as SignTransactionResponse);
          }
        });
      });
    },
    [openSigningModal],
  );

  // Handle GET_ADDRESS request
  const handleGetAddress = useCallback(
    (origin: string) => {
      return { address: getAddressForOrigin(origin) };
    },
    [getAddressForOrigin],
  );

  // Handle DISCONNECT request - simplified to use AuthStateManager
  const handleDisconnect = useCallback(
    async (origin: string) => {
      console.log("[IframeApp] Disconnecting for origin:", origin);

      // Delegate all cleanup to AuthStateManager
      // This handles:
      // - Setting isDisconnecting state
      // - Clearing localStorage (loginAuthenticator, okx data)
      // - Clearing sessionStorage (origin session)
      // - Revoking Stytch session
      // - Resetting state to disconnected
      // - Notifying parent window
      await logout(origin, stytch);

      return {};
    },
    [logout, stytch],
  );

  // Handle ADD_AUTHENTICATOR request
  const handleAddAuthenticator = useCallback(
    (
      origin: string,
      payload: AddAuthenticatorPayload,
    ): Promise<AddAuthenticatorResponse> => {
      setCurrentOrigin(origin);
      return new Promise((resolve) => {
        openAddAuthModal(payload, (value: unknown) => resolve(value as AddAuthenticatorResponse));
      });
    },
    [openAddAuthModal],
  );

  // Handle REMOVE_AUTHENTICATOR request
  const handleRemoveAuthenticator = useCallback(
    (
      origin: string,
      payload: RemoveAuthenticatorPayload,
    ): Promise<RemoveAuthenticatorResponse> => {
      setCurrentOrigin(origin);
      return new Promise((resolve) => {
        openRemoveAuthModal(payload.authenticatorId, (value: unknown) => resolve(value as RemoveAuthenticatorResponse));
      });
    },
    [openRemoveAuthModal],
  );

  // Handle REQUEST_GRANT request
  // We need to use a ref to access the latest abstractAccount value in the callback
  const abstractAccountRef = useRef(abstractAccount);
  useEffect(() => {
    abstractAccountRef.current = abstractAccount;
  }, [abstractAccount]);

  const handleRequestGrant = useCallback(
    (
      origin: string,
      payload: RequestGrantPayload,
    ): Promise<RequestGrantResponse> => {
      console.log(
        "[IframeApp] REQUEST_GRANT received for treasury:",
        payload.treasuryAddress,
        "grantee:",
        payload.grantee,
      );
      setCurrentOrigin(origin);

      // Wait for abstractAccount to be ready before opening the grant modal
      // This prevents showing a loading spinner that never resolves
      const waitForAccount = (): Promise<void> => {
        return new Promise((resolve) => {
          const checkAccount = () => {
            if (abstractAccountRef.current) {
              resolve();
            } else {
              console.log(
                "[IframeApp] Waiting for abstractAccount to be ready...",
              );
              setTimeout(checkAccount, 200);
            }
          };
          checkAccount();
        });
      };

      return new Promise((resolve) => {
        // Wait up to 10 seconds for abstractAccount to be ready
        const timeout = setTimeout(() => {
          console.error("[IframeApp] Timeout waiting for abstractAccount");
          resolve({ success: false });
        }, 10000);

        waitForAccount().then(() => {
          clearTimeout(timeout);

          console.log("[IframeApp] abstractAccount ready, opening grant modal");
          openGrantModal(payload.treasuryAddress, payload.grantee, (value: unknown) => resolve(value as RequestGrantResponse));
        });
      });
    },
    [openGrantModal],
  );

  // Set up message handler
  useIframeMessageHandler({
    onConnect: handleConnect,
    onSignTransaction: handleSignTransaction,
    onSignAndBroadcast: handleSignAndBroadcast,
    onGetAddress: handleGetAddress,
    onDisconnect: handleDisconnect,
    onAddAuthenticator: handleAddAuthenticator,
    onRemoveAuthenticator: handleRemoveAuthenticator,
    onRequestGrant: handleRequestGrant,
  });

  // Check if we're in an iframe that's part of StandAloneWrapper (same-origin iframe)
  // This is needed because the iframe receives isStandalone=false, but should still render App
  const isInStandaloneIframe = (() => {
    if (isStandalone) return false; // Already standalone, no need to check
    try {
      const isSameOrigin =
        window.parent !== window &&
        window.parent.location.origin === window.location.origin;
      // Check if parent has the XionSDK marker
      return isSameOrigin && (window.parent as unknown as Record<string, unknown>).__xionSDK !== undefined;
    } catch {
      return false;
    }
  })();

  // Render content based on mode and authentication status
  const renderContent = () => {
    // When we have an abstract account, show the App (both standalone and same-origin iframe)
    if ((isStandalone || isInStandaloneIframe) && abstractAccount) {
      return <App />;
    }

    // Show loading state when we have an authenticator but no account yet
    // This happens after login while smart accounts are being fetched
    if (loginAuthenticator && connectionMethod !== CONNECTION_METHOD.None) {
      return (
        <div className="ui-flex ui-flex-col ui-w-full ui-h-full ui-items-center ui-justify-center ui-bg-background">
          <div className="ui-text-center ui-p-6">
            <div className="ui-animate-spin ui-w-8 ui-h-8 ui-border-2 ui-border-primary ui-border-t-transparent ui-rounded-full ui-mx-auto ui-mb-4" />
            <p className="ui-text-body ui-text-text-secondary">Loading your account...</p>
          </div>
        </div>
      );
    }

    // Not authenticated yet - show welcome screen or empty container
    if (isStandalone || isInStandaloneIframe) {
      return (
        <div className="ui-flex ui-flex-col ui-w-full ui-h-full ui-items-center ui-justify-center ui-bg-background">
          <div className="ui-text-center ui-p-6">
            <h1 className="ui-text-title-lg ui-mb-4">
              Welcome to XION Auth
            </h1>
            <p className="ui-text-body ui-text-text-secondary ui-mb-6">
              Please sign in to continue
            </p>
          </div>
        </div>
      );
    }

    // Pure iframe mode - empty container (modals will overlay)
    return <div className="ui-w-full ui-h-full" />;
  };

  // Debug: Log render state
  console.log("[IframeApp] Render:", {
    showAuthModal: modals.showAuthModal,
    hasAbstractAccount: !!abstractAccount,
    isStandalone,
  });

  return (
    <>
      {renderContent()}

      {/* Modals - Always rendered regardless of mode */}
      {/* Auth Modal - hidden when account selector is shown */}
      <Dialog
        open={modals.showAuthModal && !showAccountSelector}
        onOpenChange={(open) => {
          console.log("[IframeApp] Dialog onOpenChange called with:", open);
          if (!open) {
            modals.closeAuthModal();
          }
        }}
      >
        <DialogContent
          className="md:ui-max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <LoginScreen />
        </DialogContent>
      </Dialog>

      {/* Account Selector Modal - shown when user has multiple accounts */}
      <Dialog
        open={showAccountSelector && !abstractAccount}
        onOpenChange={(open) => {
          if (!open) {
            setShowAccountSelector(false);
            // Also close auth modal if it was waiting
            if (modals.showAuthModal) {
              modals.closeAuthModal();
            }
          }
        }}
      >
        <DialogContent
          className="md:ui-max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <LoginWalletSelector />
        </DialogContent>
      </Dialog>

      {/* Add Authenticator Modal */}
      <AddAuthenticatorsModal trigger={null} />

      {/* Remove Authenticator Modal */}
      <RemoveAuthenticatorModal
        isOpen={modals.showRemoveAuthModal}
        setIsOpen={(open) => {
          if (!open) {
            modals.closeRemoveAuthModal({ error: "User cancelled" });
          }
        }}
        authenticator={
          (modals.modalState.payload as { authenticatorId?: number })?.authenticatorId
            ? {
                authenticator: {
                  id: (modals.modalState.payload as { authenticatorId: number }).authenticatorId,
                } as unknown as Authenticator,
              }
            : undefined
        }
      />

      {/* Signing Modal */}
      <SigningModal
        isOpen={modals.showSigningModal}
        onClose={() => {
          modals.closeSigningModal({ error: "User rejected" });
        }}
        transaction={(modals.modalState.payload as { transaction?: SignTransactionPayload["transaction"] } | undefined)?.transaction ?? null}
        connectionMethod={connectionMethod}
        onApprove={async () => {
          const { payload, resolver } = modals.modalState;
          const transaction = (payload as { transaction?: SignTransactionPayload["transaction"] } | undefined)?.transaction;

          if (!transaction || !resolver || !signingClient || !abstractAccount) {
            console.error("[IframeApp] Missing required data for signing");
            return;
          }

          try {
            console.log(
              "[IframeApp] User approved transaction, signing and broadcasting...",
              transaction,
            );

            // Convert transaction data to format expected by signAndBroadcast
            const fee = transaction.fee.granter
              ? {
                  amount: transaction.fee.amount,
                  gas: transaction.fee.gas,
                  granter: transaction.fee.granter,
                  payer: transaction.fee.payer,
                }
              : transaction.fee.gas || "auto";

            const result = await signingClient.signAndBroadcast(
              abstractAccount.id,
              transaction.messages,
              fee as StdFee | "auto",
              transaction.memo || "",
            );

            console.log(
              "[IframeApp] Transaction broadcast successful:",
              result,
            );

            // Resolve promise with signed transaction
            modals.closeSigningModal({ signedTx: result });
          } catch (error) {
            console.error(
              "[IframeApp] Error signing/broadcasting transaction:",
              error,
            );
            modals.closeSigningModal({
              error:
                error instanceof Error ? error.message : "Transaction failed",
            });
          }
        }}
        onReject={() => {
          modals.closeSigningModal({ error: "User rejected" });
        }}
      />

      {/* Grant Modal - Using the same AbstraxionGrant component as standalone app */}
      <Dialog
        open={modals.showGrantModal}
        onOpenChange={(open) => {
          console.log("[IframeApp] Grant dialog onOpenChange:", open);
          if (!open) {
            modals.closeGrantModal(false);
          }
        }}
      >
        <DialogContent
          className="md:ui-max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {abstractAccount ? (
            <LoginGrantApproval
              contracts={[]}
              grantee={(modals.modalState.payload as { grantee?: string } | undefined)?.grantee || ""}
              stake={false}
              bank={[]}
              treasury={(modals.modalState.payload as { treasuryAddress?: string } | undefined)?.treasuryAddress}
              onApprove={() => {
                console.log("[IframeApp] Grant approved, closing modal");
                modals.closeGrantModal(true);
              }}
              onDeny={() => {
                console.log("[IframeApp] Grant denied, closing modal");
                modals.closeGrantModal(false);
              }}
              onError={(error) => {
                console.error("[IframeApp] Grant error:", error);
                // Don't close modal on error - let user retry or cancel
              }}
            />
          ) : (
            <div className="ui-p-6 ui-text-center">
              <div className="ui-animate-spin ui-w-8 ui-h-8 ui-border-2 ui-border-primary ui-border-t-transparent ui-rounded-full ui-mx-auto ui-mb-4" />
              <p className="ui-text-body ui-text-text-muted">Loading account...</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
