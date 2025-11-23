import React, { useContext, useEffect, useMemo } from "react";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../../components/AbstraxionContext";
import { Dialog, DialogContent } from "../ui";
import { AbstraxionSignin } from "../../components/AbstraxionSignin";
import { useAbstraxionAccount } from "../../hooks";
import { AbstraxionWallets } from "../../components/AbstraxionWallets";
import { ErrorDisplay } from "../../components/ErrorDisplay";
import { AbstraxionGrant } from "../AbstraxionGrant";

import { useQueryParams } from "../../hooks/useQueryParams";
import FooterLogin from "../ui/footerLogin";

export interface ModalProps {
  onClose: VoidFunction;
  isOpen: boolean;
}

const MALFORMED_REQUEST_MESSAGE =
  "Application is not setup correctly. For safety and security, we cannot log you in.";

export const Abstraxion = ({ isOpen, onClose }: ModalProps) => {
  const { contracts, stake, bank, grantee, treasury, redirect_uri } =
    useQueryParams([
      "contracts",
      "stake",
      "bank",
      "grantee",
      "treasury",
      "redirect_uri",
    ]);

  const { abstraxionError, setAbstraxionError, isInGrantFlow } = useContext(
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

  // Check for missing redirect_uri in grant flow
  useEffect(() => {
    if (isInGrantFlow && !redirect_uri) {
      setAbstraxionError(
        isInGrantFlow && !redirect_uri ? MALFORMED_REQUEST_MESSAGE : "",
      );
    }
  }, [isInGrantFlow, redirect_uri, setAbstraxionError]);

  useEffect(() => {
    const closeOnEscKey = (e: KeyboardEvent) =>
      e.key === "Escape" ? onClose() : null;
    document.addEventListener("keydown", closeOnEscKey);
    return () => {
      document.removeEventListener("keydown", closeOnEscKey);
    };
  }, [onClose]);

  // Determine if the error is a malformed request error
  const isMalformedRequest = useMemo(() => {
    return abstraxionError?.startsWith(MALFORMED_REQUEST_MESSAGE);
  }, [abstraxionError]);

  const handleReturn = () => {
    window.history.back();
  };

  if (!isOpen) return null;

  // Determine content key to force remount on major content changes
  const contentKey = useMemo(() => {
    if (abstraxionError) return "error";
    if (
      account?.id &&
      grantee &&
      (contractsArray.length > 0 || stake || bankArray.length > 0 || treasury)
    ) {
      return "grant";
    }
    if (isConnected) return "wallets";
    return "signin";
  }, [
    abstraxionError,
    account?.id,
    grantee,
    contractsArray.length,
    stake,
    bankArray.length,
    treasury,
    isConnected,
  ]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent key={contentKey}>
          {abstraxionError ? (
            <ErrorDisplay
              description={abstraxionError}
              onClose={onClose}
              title={isMalformedRequest ? "Login Error" : undefined}
              buttonText={isMalformedRequest ? "RETURN" : "CLOSE"}
              onButtonClick={isMalformedRequest ? handleReturn : undefined}
              errorMessage={
                isMalformedRequest ? "redirect_uri is not defined" : undefined
              }
            />
          ) : account?.id &&
            grantee &&
            // We support granting any combination of
            (contractsArray.length > 0 ||
              stake ||
              bankArray.length > 0 ||
              treasury) ? (
            <AbstraxionGrant
              bank={bankArray}
              contracts={contractsArray}
              grantee={grantee}
              stake={Boolean(stake)}
              treasury={treasury || undefined}
            />
          ) : isConnected ? (
            <AbstraxionWallets />
          ) : (
            <AbstraxionSignin />
          )}
        </DialogContent>
      </Dialog>
      {/* TOS Footer - Only show during login flows, not when viewing wallets in dashboard */}
      {!isConnected && <FooterLogin />}
    </>
  );
};
