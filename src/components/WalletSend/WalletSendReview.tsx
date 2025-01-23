import React from "react";
import { Button } from "../ui";
import { SelectedSmartAccount } from "../../indexer-strategies/types";
import { FormattedAssetAmount } from "../../types/assets";

interface WalletSendReviewProps {
  sendAmount: string;
  selectedCurrency: FormattedAssetAmount;
  account: SelectedSmartAccount;
  userMemo: string;
  recipientAddress: string;
  onBack: () => void;
  triggerSend: () => Promise<void>;
  isLoading: boolean;
}

export function WalletSendReview({
  sendAmount,
  selectedCurrency,
  account,
  userMemo,
  recipientAddress,
  isLoading,
  onBack,
  triggerSend,
}: WalletSendReviewProps) {
  const handleBackClick = () => {
    onBack();
  };

  const handleProceedClick = () => {
    triggerSend();
  };

  return (
    <>
      <div className="ui-p-0 ui-flex ui-flex-col ui-gap-4 max-h-full ui-h-full">
        <div className="ui-flex ui-flex-col ui-gap-3">
          <h1 className="ui-w-full ui-text-center ui-text-[32px] ui-leading-[120%] ui-font-thin">
            REVIEW
          </h1>
          <p className="ui-w-full ui-text-center ui-text-sm ui-text-white/40">
            You are about to make the transaction below.
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
                    {selectedCurrency.symbol.toUpperCase()}
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

        <div className="ui-flex ui-flex-col ui-gap-3 ui-mt-8">
          <Button disabled={isLoading} onClick={handleProceedClick}>
            {isLoading ? "Loading..." : "CONFIRM"}
          </Button>
          <Button
            disabled={isLoading}
            onClick={handleBackClick}
            structure="naked"
            className="ui-no-underline ui-mb-10 sm:ui-mb-0"
          >
            GO BACK
          </Button>
        </div>
      </div>
    </>
  );
}
