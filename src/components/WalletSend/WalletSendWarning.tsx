import React from "react";
import { Button } from "../ui";

interface WalletSendWarningProps {
  onContinue: () => void;
  onCancel: () => void;
}

export function WalletSendWarning({
  onContinue,
  onCancel,
}: WalletSendWarningProps) {
  return (
    <div className="ui-p-0 md:ui-p-8 ui-flex ui-flex-col ui-gap-8 ui-items-center">
      <div className="ui-flex ui-flex-col ui-gap-4 ui-w-full">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          ARE YOU SURE?
        </h1>
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
          We cannot confirm the validity of this address and the transaction
          cannot be reversed.
        </p>
      </div>
      <Button onClick={onContinue} structure="destructive-outline" fullWidth>
        CONTINUE
      </Button>
      <Button onClick={onCancel} fullWidth>
        CANCEL
      </Button>
    </div>
  );
}
