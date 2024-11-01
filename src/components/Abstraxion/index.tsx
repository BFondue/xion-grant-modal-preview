import React, { useContext, useEffect } from "react";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../../components/AbstraxionContext";
import { Dialog, DialogContent } from "@burnt-labs/ui";
import { AbstraxionSignin } from "../../components/AbstraxionSignin";
import { useAbstraxionAccount } from "../../hooks";
import { AbstraxionWallets } from "../../components/AbstraxionWallets";
import { ErrorDisplay } from "../../components/ErrorDisplay";
import { AbstraxionGrant } from "../AbstraxionGrant";

import xionLogo from "../../assets/logo.png";
import { useQueryParams } from "../../hooks/useQueryParams";

export interface ModalProps {
  onClose: VoidFunction;
  isOpen: boolean;
}

export const Abstraxion = ({ isOpen, onClose }: ModalProps) => {
  const { contracts, stake, bank, grantee, treasury } = useQueryParams([
    "contracts",
    "stake",
    "bank",
    "grantee",
    "treasury",
  ]);

  const { abstraxionError, isMainnet } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const { isConnected, data: account } = useAbstraxionAccount();

  let bankArray;
  try {
    bankArray = JSON.parse(bank || "");
  } catch {
    // If the bank is not a valid JSON, we split it by comma. Dapp using old version of the library.
    bankArray = [];
  }

  let contractsArray;
  try {
    contractsArray = JSON.parse(contracts || "");
  } catch {
    // If the contracts are not a valid JSON, we split them by comma. Dapp using old version of the library.
    contractsArray = contracts?.split(",") || [];
  }

  useEffect(() => {
    const closeOnEscKey = (e: KeyboardEvent) =>
      e.key === "Escape" ? onClose() : null;
    document.addEventListener("keydown", closeOnEscKey);
    return () => {
      document.removeEventListener("keydown", closeOnEscKey);
    };
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className={`${isMainnet ? "" : "!ui-bg-white/10"}`}>
          {abstraxionError ? (
            <ErrorDisplay message={abstraxionError} onClose={onClose} />
          ) : account?.id &&
            grantee &&
            // We support granting any combunation of
            (contractsArray.length > 0 ||
              stake ||
              bankArray.length > 0 ||
              treasury) ? (
            <AbstraxionGrant
              bank={bankArray}
              contracts={contractsArray}
              grantee={grantee}
              stake={Boolean(stake)}
              treasury={treasury}
            />
          ) : isConnected ? (
            <AbstraxionWallets />
          ) : (
            <AbstraxionSignin />
          )}
        </DialogContent>
      </Dialog>
      {/* TOS Footer */}
      {!isConnected && (
        <div className="ui-self-end ui-pointer-events-auto ui-w-full ui-z-[1000] ui-flex ui-flex-col ui-pb-safe sm:ui-flex-row sm:ui-justify-between sm:ui-items-end">
          <div className="ui-font-akkuratLL ui-text-xs sm:ui-text-sm ui-font-normal ui-text-center sm:ui-text-left">
            <span className="ui-text-neutral-400">
              By continuing, you agree to and acknowledge that you have read and
              understand the
            </span>
            <a
              href="https://burnt.com/terms-and-conditions"
              className="ui-pl-1 ui-text-white"
            >
              Disclaimer
            </a>
            <span className="ui-text-neutral-400">.</span>
          </div>
          <div className="ui-flex ui-gap-2 ui-justify-center ui-items-end ui-mt-2 sm:ui-my-0">
            <p className="ui-font-akkuratLL ui-text-sm ui-text-zinc-100 ui-opacity-50 leading-tight">
              Powered by
            </p>
            <div className="ui-flex ui-flex-row-reverse ui-items-center sm:ui-items-start  sm:ui-flex-col">
              <div
                className={`ui-flex ui-justify-between ${
                  isMainnet ? "ui-bg-mainnet-bg" : "ui-bg-testnet-bg"
                } ui-px-2 ui-py-1 ui-ml-2 sm:ui-ml-0 sm:ui-mb-2 ${
                  isMainnet ? "ui-text-mainnet" : "ui-text-testnet"
                } ui-rounded-md ui-font-akkuratLL ui-text-xs ui-tracking-widest`}
              >
                {isMainnet ? "MAINNET" : "TESTNET"}
              </div>
              <a href="https://burnt.com/terms-and-conditions">
                <img src={xionLogo} alt="XION Logo" width="108" height="48" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
