import React from "react";
import { Button } from "@burnt-labs/ui";
import type { FormattedAssetAmount } from "../../types/assets";
import { SelectedSmartAccount } from "../../indexer-strategies/types";

interface WalletSendSuccessProps {
  sendAmount: string;
  selectedCurrency: FormattedAssetAmount;
  userMemo: string;
  account: SelectedSmartAccount;
  recipientAddress: string;
  onFinish: () => void;
}

export function WalletSendSuccess({
  sendAmount,
  selectedCurrency,
  userMemo,
  account,
  recipientAddress,
  onFinish,
}: WalletSendSuccessProps) {
  const handleConfirmClick = () => {
    onFinish();
  };

  return (
    <>
      <div className="ui-p-0 ui-flex ui-flex-col ui-gap-4">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          SUCCESS!
        </h1>
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
          You have initiated the transaction below.
        </p>
        <div className="ui-my-6 ui-h-[1px] ui-w-full ui-bg-white/20" />
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
          Transfer Amount
        </p>
        <p className="ui-w-full ui-text-center ui-text-4xl ui-font-akkuratLL ui-text-white ui-font-semibold">
          {sendAmount}{" "}
          <span className="ui-text-white/40">
            {selectedCurrency.asset.display.toUpperCase()}
          </span>
        </p>
        <p className="ui-w-full ui-text-center ui-text-md ui-font-akkuratLL ui-text-white/40">
          ${selectedCurrency.dollarValue.toFixed(2)} USD
        </p>
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/70 ui-italic">
          {userMemo}
        </p>
        <div className="ui-my-6 ui-h-[1px] ui-w-full ui-bg-white/20" />
        <div>
          <p className="ui-w-full ui-text-center ui-text-xs ui-font-akkuratLL ui-text-white/40">
            From
          </p>
          <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white ui-break-words">
            {account.id}
          </p>
        </div>
        <div className="ui-mb-4">
          <p className="ui-w-full ui-text-center ui-text-xs ui-font-akkuratLL ui-text-white/40">
            To
          </p>
          <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white ui-break-words">
            {recipientAddress}
          </p>
        </div>
        <Button onClick={() => handleConfirmClick()}>CLOSE</Button>
      </div>
    </>
  );
}
