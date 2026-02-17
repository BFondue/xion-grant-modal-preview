import { useContext, useMemo, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  BaseButton,
  CloseIcon,
  DialogClose,
} from "../ui";
import { useSmartAccount } from "../../hooks";
import { useXionDisconnect } from "../../hooks/useXionDisconnect";
import { useAccountDiscovery } from "../../hooks/useAccountDiscovery";
import { truncateAddress } from "../../utils";
import { AuthContext, AuthContextProps } from "../AuthContext";
import { deduplicateAccountsById } from "../../utils/authenticator-utils";
import type { Authenticator } from "@burnt-labs/account-management";

interface DashboardAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DashboardAccountDialog: React.FC<DashboardAccountDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { data: currentAccount, loginAuthenticator } = useSmartAccount();
  const { xionDisconnect } = useXionDisconnect();
  const { setAbstractAccount } = useContext(AuthContext) as AuthContextProps;

  // Fetch all accounts for the current authenticator
  const { data: allAccounts, loading } = useAccountDiscovery();

  // Deduplicate accounts and ensure current account is included
  const uniqueAccounts = useMemo(() => {
    const accounts = allAccounts || [];

    // If we have a current account but it's not in the list yet, add it
    if (
      currentAccount &&
      !accounts.some((acc) => acc.id === currentAccount.id)
    ) {
      accounts.push({
        id: currentAccount.id,
        codeId: currentAccount.codeId,
        authenticators: currentAccount.authenticators,
      });
    }

    return deduplicateAccountsById(accounts);
  }, [allAccounts, currentAccount]);

  const handleDisconnect = useCallback(() => {
    xionDisconnect();
    onClose();
  }, [xionDisconnect, onClose]);

  const handleAccountSwitch = useCallback(
    (accountIndex: number) => {
      const selectedAccount = uniqueAccounts[accountIndex];
      if (selectedAccount && selectedAccount.id !== currentAccount?.id) {
        // Find the authenticator that matches the current login method
        const matchingAuthenticator =
          selectedAccount.authenticators.find(
            (auth: Authenticator) => auth.authenticator === loginAuthenticator,
          ) || selectedAccount.authenticators[0];

        setAbstractAccount({
          ...selectedAccount,
          currentAuthenticatorIndex: matchingAuthenticator.authenticatorIndex,
        });
      }
    },
    [
      uniqueAccounts,
      currentAccount?.id,
      loginAuthenticator,
      setAbstractAccount,
    ],
  );

  if (!currentAccount?.id) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <div className="ui-flex ui-h-full ui-w-full ui-flex-col ui-items-start ui-justify-center ui-gap-12">
          <DialogClose className="ui-absolute ui-top-6 ui-right-6">
            <CloseIcon strokeWidth={2} className="ui-w-4 ui-h-4" />
          </DialogClose>

          <DialogHeader>
            <DialogTitle>
              {uniqueAccounts.length > 1 ? "Select Account" : "Active Account"}
            </DialogTitle>
            <DialogDescription>
              {uniqueAccounts.length > 1
                ? "Select an account to switch to"
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="ui-flex ui-w-full ui-flex-col ui-gap-6">
            {loading && uniqueAccounts.length === 0 ? (
              <div className="ui-flex ui-justify-center ui-py-8">
                <p className="ui-text-sm ui-text-secondary-text">
                  Loading accounts...
                </p>
              </div>
            ) : (
              <>
                {/* Active Account Section */}
                <div className="ui-flex ui-flex-col ui-gap-2">
                  <p className="ui-text-sm ui-text-secondary-text ui-font-medium">
                    Active Account
                  </p>
                  {uniqueAccounts.map((account, index) => {
                    const isActive = account.id === currentAccount.id;
                    if (!isActive) return null;

                    return (
                      <div
                        key={`${account.id}-${index}`}
                        className="ui-flex ui-items-center ui-gap-3 ui-p-4 ui-h-[55px] ui-rounded-lg ui-px-4 ui-py-3 ui-bg-white/[0.08] ui-border ui-border-white/30"
                      >
                        <div className="ui-flex ui-flex-col ui-flex-1 ui-text-left">
                          <p className="ui-text-base ui-font-semibold">
                            Personal Account{" "}
                            {uniqueAccounts.length > 1 ? index + 1 : ""}
                          </p>
                        </div>
                        <div className="ui-bg-white/10 ui-px-1.5 ui-py-0.5 ui-rounded-[4px] ui-text-xs ui-font-bold">
                          <span className="ui-text-white/80">
                            {truncateAddress(account.id)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Other Accounts Section */}
                {uniqueAccounts.length > 1 && (
                  <div className="ui-flex ui-flex-col ui-gap-2">
                    <p className="ui-text-sm ui-text-secondary-text ui-font-medium">
                      Other Accounts
                    </p>
                    {uniqueAccounts.map((account, index) => {
                      const isActive = account.id === currentAccount.id;
                      if (isActive) return null;

                      return (
                        <button
                          key={`${account.id}-${index}`}
                          onClick={() => handleAccountSwitch(index)}
                          className="ui-flex ui-items-center ui-gap-3 ui-p-4 ui-h-[55px] ui-rounded-lg ui-px-4 ui-py-3 ui-transition-all ui-bg-white/[0.05] ui-border ui-border-white/10 hover:ui-bg-white/[0.08] hover:ui-border-white/20 ui-cursor-pointer"
                        >
                          <div className="ui-flex ui-flex-col ui-flex-1 ui-text-left">
                            <p className="ui-text-base ui-font-semibold">
                              Personal Account {index + 1}
                            </p>
                          </div>
                          <div className="ui-bg-white/10 ui-px-1.5 ui-py-0.5 ui-rounded-[4px] ui-text-xs ui-font-bold">
                            <span className="ui-text-white/80">
                              {truncateAddress(account.id)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="ui-w-full">
            <BaseButton
              variant="destructive"
              className="ui-w-full"
              onClick={handleDisconnect}
            >
              DISCONNECT
            </BaseButton>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
