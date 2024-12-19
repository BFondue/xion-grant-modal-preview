import React, { useContext, useState } from "react";
import { AccountInfo } from "./AccountInfo";
import { AbstraxionContext } from "./AbstraxionContext";
import { Overview } from "./Overview";
import { Sidebar } from "./Sidebar";
import { Abstraxion } from "./Abstraxion";
import { useAbstraxionAccount } from "../hooks";

import xionLogo from "../assets/logo.png";
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
  const { isOpen, setIsOpen, isMainnet } = useContext(AbstraxionContext);

  const [showMobileSiderbar, setShowMobileSiderbar] = useState(false);

  return (
    <>
      {!account?.id || (grantee && (contracts || stake || bank || treasury)) ? (
        <div className="ui-flex ui-w-full ui-h-svh ui-z-[10000] ui-fixed ui-flex-1 ui-items-center ui-justify-center ui-overflow-y-auto ui-p-6">
          <Abstraxion onClose={() => null} isOpen={true} />
        </div>
      ) : (
        <div className="ui-flex ui-relative ui-max-h-dvh">
          {showMobileSiderbar ? (
            <div className="ui-absolute ui-min-h-dvh ui-w-screen ui-bg-black ui-bg-opacity-20 ui-backdrop-blur-md ui-z-50">
              <Sidebar onClose={() => setShowMobileSiderbar(false)} />
            </div>
          ) : null}
          <div className="ui-hidden sm:ui-flex">
            <Sidebar />
          </div>

          <div className="ui-flex ui-flex-1 ui-max-w-full ui-flex-col">
            <div className="ui-flex sm:!ui-hidden  ui-justify-between ui-items-center ui-bg-black ui-p-6 ui-border-b-[1px] ui-border-[#6C6A6A]">
              <div className="ui-flex ui-items-center">
                <img src={xionLogo} alt="XION Logo" width="90" height="32" />
                <div
                  className={`ui-flex ${
                    isMainnet ? "ui-bg-mainnet-bg" : "ui-bg-testnet-bg"
                  } ui-px-2 ui-py-1 ui-ml-4 ${
                    isMainnet ? "ui-text-mainnet" : "ui-text-testnet"
                  } ui-rounded-md ui-font-akkuratLL ui-text-xs ui-tracking-widest`}
                >
                  {isMainnet ? "MAINNET" : "TESTNET"}
                </div>
              </div>
              <div onClick={() => setShowMobileSiderbar(true)}>
                <div className="ui-bg-white ui-w-8 ui-h-[1px] ui-mb-2" />
                <div className="ui-bg-white ui-w-6 ui-h-[1px] ui-ml-auto" />
              </div>
            </div>
            <div className="ui-h-screen ui-bg-black ui-flex-1 ui-overflow-y-auto ui-p-6">
              <div className="ui-relative">
                <Abstraxion onClose={() => setIsOpen(false)} isOpen={isOpen} />
                {/* Tiles */}
                <div className="ui-mx-auto ui-flex ui-max-w-7xl">
                  {/* Left Tiles */}
                  <div className="ui-flex-grow-2 ui-flex ui-flex-col ui-max-w-full">
                    <h3 className="ui-font-akkuratLL ui-mb-4 ui-text-2xl ui-text-white ui-font-bold">
                      Overview
                    </h3>
                    <Overview account={account} />
                    <h3 className="ui-font-akkuratLL ui-mb-4 ui-mt-8 ui-text-2xl ui-font-bold ui-text-white">
                      Account Info
                    </h3>
                    <AccountInfo
                      updateContractCodeID={updateAbstractAccountCodeId}
                    />
                  </div>
                  {/* Right Tiles */}
                  {/* <div className="ui-hidden sm:ui-flex sm:ui-flex-1 sm:ui-flex-col"></div> */}
                </div>
                {/* Right Tiles */}
                {/* <div className="ui-hidden sm:ui-flex sm:ui-flex-1 sm:ui-flex-col"></div> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
