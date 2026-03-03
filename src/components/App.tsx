import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AccountInfo } from "./AccountInfo";
import { AuthContext } from "./AuthContext";
import { Overview } from "./Overview";
import { TopNav } from "./TopNav";
import { LoginModal } from "./LoginModal";
import { useSmartAccount } from "../hooks";
import { useQueryParams } from "../hooks/useQueryParams";
import { Banner } from "./ui";
import { Dialog, DialogContent } from "./ui";
import { AccountMigration } from "./AccountMigration";
import { useWalletChangeListener } from "../hooks/useWalletChangeListener";
import { SignTransactionView } from "./SignTransactionView";
import { useXionDisconnect } from "../hooks/useXionDisconnect";
import { InlineConnectedView } from "./InlineConnectedView";
import { IframeMessageHandler } from "../messaging/handler";
import type { ConnectResponse, SignTransactionPayload, SignTransactionResponse } from "../messaging/types";
import { AuthStateManager } from "../auth/AuthStateManager";

export function App() {
  const { contracts, stake, bank, grantee, treasury, mode, redirect_uri, granted } =
    useQueryParams([
      "contracts",
      "stake",
      "bank",
      "grantee",
      "treasury",
      "mode",
      "redirect_uri",
      "granted",
    ]);
  const { data: account, updateAbstractAccountCodeId } = useSmartAccount();
  const { isOpen, setIsOpen } = useContext(AuthContext);

  // Listen for wallet account changes (Keplr/MetaMask)
  useWalletChangeListener();

  const { xionDisconnect } = useXionDisconnect();

  // mode=inline: Dashboard is running inside an inline iframe embedded by a dApp.
  // Show a minimal connected view instead of the full dashboard.
  const isInlineMode = mode === "inline";

  // Ref to hold the pending CONNECT promise resolver.
  // Resolved when auth + grants complete (via onApprove callback or no-grants useEffect).
  const connectResolverRef = useRef<{
    resolve: (value: ConnectResponse) => void;
    reject: (error: Error) => void;
  } | null>(null);

  // ─── Inline mode: direct signing state ──────────────────────────────────────
  // Pending sign request: transaction data + MessageChannel resolver
  const signRequestRef = useRef<{
    transaction: SignTransactionPayload["transaction"];
    resolve: (value: SignTransactionResponse) => void;
    reject: (error: Error) => void;
  } | null>(null);
  const [showSigningModal, setShowSigningModal] = useState(false);

  // Track whether the user was connected in inline mode.
  // After disconnect, render nothing — the SDK is about to remove the iframe,
  // so showing LoginModal/LoginScreen would cause a brief flash.
  const wasConnectedRef = useRef(false);
  if (account?.id && isInlineMode) {
    wasConnectedRef.current = true;
  }

  // ─── IframeMessageHandler for inline mode ────────────────────────────────────
  // Replaces raw LOGOUT/CONNECT_SUCCESS/CONNECT_REJECTED postMessage listeners.
  // Provides defense-in-depth: rate limiting, replay detection, payload validation,
  // HTTPS enforcement, and origin-scoped request logging.
  useEffect(() => {
    if (!isInlineMode) return;

    const handler = new IframeMessageHandler({
      onConnect: (origin, _payload) => {
        // Store parent origin for scoped DISCONNECTED postMessage
        AuthStateManager.setParentOrigin(origin);

        // Return a Promise that stays open until auth + grants complete.
        // It will be resolved by handleGrantApproved or the no-grants useEffect.
        return new Promise<ConnectResponse>((resolve, reject) => {
          connectResolverRef.current = { resolve, reject };
        });
      },

      onDisconnect: async (_origin) => {
        await xionDisconnect();
        return {};
      },

      onGetAddress: (_origin) => {
        return { address: account?.id ?? null };
      },

      // Direct signing: show SigningModal, resolve when user approves/rejects
      onSignTransaction: (_origin, payload) => {
        return new Promise<SignTransactionResponse>((resolve, reject) => {
          signRequestRef.current = { transaction: payload.transaction, resolve, reject };
          setShowSigningModal(true);
        });
      },
      onSignAndBroadcast: (_origin, payload) => {
        return new Promise<SignTransactionResponse>((resolve, reject) => {
          signRequestRef.current = { transaction: payload.transaction, resolve, reject };
          setShowSigningModal(true);
        });
      },
      onAddAuthenticator: async () => {
        throw new Error("Add authenticator not available in inline mode");
      },
      onRemoveAuthenticator: async () => {
        throw new Error("Remove authenticator not available in inline mode");
      },
      onRequestGrant: async () => {
        throw new Error("Request grant not available in inline mode");
      },
    });

    // Signal to the SDK that the handler is mounted and ready for MessageChannel requests
    window.parent.postMessage({ type: "IFRAME_READY" }, "*");

    return () => handler.destroy();
  }, [isInlineMode]);

  // ─── Grant approval / denial callbacks (threaded to LoginModal) ──────────────
  const handleGrantApproved = useCallback(() => {
    // Set ?granted=true in URL so App.tsx renders InlineConnectedView
    const url = new URL(window.location.href);
    url.searchParams.set("granted", "true");
    window.history.replaceState({}, "", url.toString());
    // Trigger useQueryParams re-read
    window.dispatchEvent(new PopStateEvent("popstate"));

    // Resolve the pending CONNECT promise with the user's address
    if (connectResolverRef.current && account?.id) {
      connectResolverRef.current.resolve({ address: account.id });
      connectResolverRef.current = null;
    }
  }, [account?.id]);

  const handleGrantDenied = useCallback(() => {
    if (connectResolverRef.current) {
      connectResolverRef.current.reject(new Error("Connection rejected by user"));
      connectResolverRef.current = null;
    }
  }, []);

  // ─── No-grants-needed resolution ────────────────────────────────────────────
  // If account is connected and no grants are needed, resolve CONNECT immediately.
  const needsGrants = !!(grantee && (contracts || stake || bank || treasury));
  useEffect(() => {
    if (!isInlineMode) return;
    if (!account?.id) return;
    if (needsGrants && !granted) return; // Grants still pending
    if (!connectResolverRef.current) return;

    connectResolverRef.current.resolve({ address: account.id });
    connectResolverRef.current = null;
  }, [isInlineMode, account?.id, needsGrants, granted]);

  // ─── Inline signing result handler ──────────────────────────────────────────
  const handleSignResult = useCallback((data: Record<string, unknown>) => {
    const req = signRequestRef.current;
    if (!req) return;

    if (data.type === "SIGN_SUCCESS" && data.txHash) {
      req.resolve({ signedTx: { transactionHash: data.txHash } } as unknown as SignTransactionResponse);
    } else {
      req.resolve({ error: (data.message as string) || "User rejected" } as unknown as SignTransactionResponse);
    }
    signRequestRef.current = null;
    setShowSigningModal(false);
  }, []);

  if (isInlineMode) {
    // Signing request pending: show SignTransactionView (same as popup mode=sign)
    if (showSigningModal && signRequestRef.current && account?.id) {
      return (
        <div className="ui-flex ui-w-full ui-h-svh ui-z-[50] ui-fixed ui-flex-1 ui-items-center ui-justify-center ui-overflow-y-auto ui-p-6">
          <Banner className="ui-fixed ui-top-0 ui-left-0 ui-z-[10001]" />
          <Dialog open onOpenChange={() => null}>
            <DialogContent>
              <SignTransactionView
                transaction={signRequestRef.current.transaction}
                granterAddress={account.id}
                onResult={handleSignResult}
              />
            </DialogContent>
          </Dialog>
        </div>
      );
    }

    // After disconnect, render nothing. The SDK will remove the iframe momentarily
    // (via DISCONNECTED postMessage → removeIframe). Rendering LoginModal here would
    // cause a brief flash of the login/error screen before the iframe is torn down.
    if (!account?.id && wasConnectedRef.current) {
      return null;
    }

    if (!account?.id || (!granted && needsGrants)) {
      // Not authenticated or grant flow pending (not yet completed): show LoginModal
      return (
        <div className="ui-flex ui-w-full ui-h-svh ui-z-[50] ui-fixed ui-flex-1 ui-items-center ui-justify-center ui-overflow-y-auto ui-p-6">
          <Banner className="ui-fixed ui-top-0 ui-left-0 ui-z-[10001]" />
          <LoginModal
            onClose={() => null}
            isOpen={true}
            onApprove={handleGrantApproved}
            onDeny={handleGrantDenied}
          />
        </div>
      );
    }

    // Authenticated (grants completed or none requested): show connected view
    return <InlineConnectedView account={account} redirectUri={redirect_uri} xionDisconnect={xionDisconnect} />;
  }

  // mode=sign: SDK opened this window to sign a transaction directly.
  // If the user is logged in, show the SignTransactionView. Otherwise show
  // LoginModal first — after login, App re-renders and hits this branch.
  const isSignMode = mode === "sign";

  if (isSignMode) {
    return (
      <div className="ui-flex ui-w-full ui-h-svh ui-z-[50] ui-fixed ui-flex-1 ui-items-center ui-justify-center ui-overflow-y-auto ui-p-6">
        <Banner className="ui-fixed ui-top-0 ui-left-0 ui-z-[10001]" />
        {account?.id ? (
          <Dialog open onOpenChange={() => null}>
            <DialogContent>
              <SignTransactionView />
            </DialogContent>
          </Dialog>
        ) : (
          <LoginModal onClose={() => null} isOpen={true} />
        )}
      </div>
    );
  }

  return (
    <>
      {!account?.id || (grantee && (contracts || stake || bank || treasury)) ? (
        <div className="ui-flex ui-w-full ui-h-svh ui-z-[50] ui-fixed ui-flex-1 ui-items-center ui-justify-center ui-overflow-y-auto ui-p-6">
          <Banner className="ui-fixed ui-top-0 ui-left-0 ui-z-[10001]" />
          <LoginModal onClose={() => null} isOpen={true} />
        </div>
      ) : (
        <div className="ui-flex ui-flex-col ui-min-h-screen ui-bg-background">
          <Banner />
          <TopNav />

          <main className="ui-flex-1 ui-overflow-y-auto ui-p-6">
            <div className="ui-max-w-7xl ui-mx-auto">
              <div className="ui-relative">
                <LoginModal onClose={() => setIsOpen(false)} isOpen={isOpen} />
                {/* Tiles */}
                <div className="ui-mx-auto ui-flex ui-max-w-7xl">
                  {/* Left Tiles */}
                  <div className="ui-flex-grow-2 ui-gap-6 ui-flex ui-flex-col ui-max-w-[700px] ui-mx-auto">
                    <Overview account={account} />
                    {account && (
                      <AccountMigration
                        currentCodeId={account.codeId}
                        updateContractCodeID={updateAbstractAccountCodeId}
                      />
                    )}
                    <AccountInfo />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}
