import React, { useContext } from "react";
import { AccountInfo } from "./AccountInfo";
import { AbstraxionContext } from "./AbstraxionContext";
import { Overview } from "./Overview";
import { TopNav } from "./TopNav";
import { Abstraxion } from "./Abstraxion";
import { useAbstraxionAccount } from "../hooks";
import { useQueryParams } from "../hooks/useQueryParams";

export function App() {
  const { contracts, stake, bank, grantee, treasury } = useQueryParams([
    "contracts",
    "stake",
    "bank",
    "grantee",
    "treasury",
  ]);
  const { data: account, updateAbstractAccountCodeId } = useAbstraxionAccount();
  const { isOpen, setIsOpen } = useContext(AbstraxionContext);

  return (
    <>
      {!account?.id || (grantee && (contracts || stake || bank || treasury)) ? (
        <div className="ui-flex ui-w-full ui-h-svh ui-z-[10000] ui-fixed ui-flex-1 ui-items-center ui-justify-center ui-overflow-y-auto ui-p-6">
          <Abstraxion onClose={() => null} isOpen={true} />
        </div>
      ) : (
        <div className="ui-flex ui-flex-col ui-min-h-screen ui-bg-background">
          <TopNav />

          <main className="ui-flex-1 ui-overflow-y-auto ui-p-6">
            <div className="ui-max-w-7xl ui-mx-auto">
              <div className="ui-relative">
                <Abstraxion onClose={() => setIsOpen(false)} isOpen={isOpen} />
                {/* Tiles */}
                <div className="ui-mx-auto ui-flex ui-max-w-7xl">
                  {/* Left Tiles */}
                  <div className="ui-flex-grow-2 ui-gap-8 ui-flex ui-flex-col ui-max-w-[700px] ui-mx-auto">
                    <Overview account={account} />
                    <AccountInfo
                      updateContractCodeID={updateAbstractAccountCodeId}
                    />
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
