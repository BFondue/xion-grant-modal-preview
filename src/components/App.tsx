import React, { useContext } from "react";
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

export function App() {
  const { contracts, stake, bank, grantee, treasury, mode } = useQueryParams([
    "contracts",
    "stake",
    "bank",
    "grantee",
    "treasury",
    "mode",
  ]);
  const { data: account, updateAbstractAccountCodeId } = useSmartAccount();
  const { isOpen, setIsOpen } = useContext(AuthContext);

  // Listen for wallet account changes (Keplr/MetaMask)
  useWalletChangeListener();

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
