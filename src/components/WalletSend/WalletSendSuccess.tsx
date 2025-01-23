import React from "react";
import { Button } from "../ui";
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
      <div className="ui-p-0 ui-flex ui-flex-col ui-gap-4 max-h-full ui-h-full">
        <div className="ui-flex ui-flex-col ui-gap-3">
          <h1 className="ui-w-full ui-text-center ui-text-[32px] ui-leading-[120%] ui-font-thin">
            SUCCESS!
          </h1>
          <p className="ui-w-full ui-text-center ui-text-sm ui-text-white/40">
            You have initiated the transaction below.
          </p>
        </div>
        <div className="ui-flex ui-flex-col">
          <div className="ui-mb-8 ui-mt-4 ui-h-[1px] ui-w-full ui-bg-white/10" />
          <div className="ui-flex ui-flex-col ui-gap-6">
            <div className="ui-flex ui-flex-col ui-gap-3">
              <p className="ui-w-full ui-text-center ui-text-sm ui-leading-[16px] ui-text-white/50 ui-font-semibold">
                Transfer Amount
              </p>
              <div className="ui-flex ui-flex-col ui-gap-2">
                <p className="ui-w-full ui-text-center ui-text-[40px] ui-leading-[36px] ui-text-white ui-font-semibold">
                  {sendAmount}{" "}
                  <span className="ui-text-[#949494] ui-text-[40px] ui-leading-[36px]">
                    {selectedCurrency.asset.display.toUpperCase()}
                  </span>
                </p>
                <p className="ui-w-full ui-text-center ui-text-md ui-text-[#949494]">
                  ${(Number(sendAmount) * selectedCurrency.price).toFixed(2)}{" "}
                  USD
                </p>
              </div>
            </div>
            <p className="ui-w-full ui-text-center ui-text-sm ui-text-white ui-italic">
              {userMemo}
            </p>
          </div>
          <div className="ui-mt-8 ui-h-[1px] ui-w-full ui-bg-white/10" />
        </div>
        <div className="ui-flex ui-flex-col ui-gap-8">
          <div className="ui-flex ui-flex-col ui-gap-3">
            <p className="ui-w-full ui-text-center ui-text-sm ui-leading-4 ui-text-[#949494] ui-font-semibold">
              From
            </p>
            <p className="ui-w-full ui-text-center ui-text-sm ui-text-white ui-break-words">
              {account.id}
            </p>
          </div>
          <div className="ui-flex ui-flex-col ui-gap-3">
            <p className="ui-w-full ui-text-center ui-text-sm ui-leading-4 ui-text-[#949494] ui-font-semibold">
              To
            </p>
            <p className="ui-w-full ui-text-center ui-text-sm ui-text-white ui-break-words">
              {recipientAddress}
            </p>
          </div>
        </div>
        <Button
          onClick={() => handleConfirmClick()}
          className="ui-mt-8 ui-mb-10 sm:ui-mb-0"
        >
          CLOSE
        </Button>
      </div>
    </>
  );
}
