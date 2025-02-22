import React from "react";
import {
  BaseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui";
import type { FormattedAssetAmount } from "../../types/assets";
import { SelectedSmartAccount } from "../../indexer-strategies/types";
import { truncateAddress } from "../../utils";

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
      <div className="ui-p-0 ui-flex ui-flex-col ui-gap-8 max-h-full ui-h-full">
        <DialogHeader>
          <DialogTitle>Success!</DialogTitle>
          <DialogDescription>
            You have initiated the transaction below.
          </DialogDescription>
        </DialogHeader>

        <div className="ui-flex ui-flex-col ui-gap-8">
          <div className="ui-h-[1px] ui-w-full ui-bg-border" />

          <div className="ui-flex ui-flex-col ui-gap-6">
            <div className="ui-flex ui-flex-col ui-gap-3">
              <p className="ui-w-full ui-text-center ui-text-sm ui-font-bold ui-leading-[16px] ui-text-secondary-text">
                Transfer Amount
              </p>
              <div className="ui-flex ui-flex-col ui-gap-2">
                <p className="ui-w-full ui-text-center ui-text-[40px] ui-leading-none ui-font-bold">
                  {sendAmount}{" "}
                  <span className="ui-text-[40px] ui-leading-none">
                    {selectedCurrency.asset.display.toUpperCase()}
                  </span>
                </p>
                <p className="ui-w-full ui-text-center ui-text-sm ui-text-secondary-text">
                  ${(Number(sendAmount) * selectedCurrency.price).toFixed(2)}{" "}
                  USD
                </p>
              </div>
            </div>
          </div>

          <div className="ui-h-[1px] ui-w-full ui-bg-border" />
        </div>

        <div className="ui-flex ui-flex-col ui-gap-5 ui-p-5 ui-rounded-lg ui-bg-black/50">
          <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
            <h5 className="ui-text-sm">From</h5>
            <p className="ui-text-sm ui-font-bold">
              {truncateAddress(account.id, 8, 8)}
            </p>
          </div>

          <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
            <h5 className="ui-text-sm">To</h5>
            <p className="ui-text-sm ui-font-bold">
              {truncateAddress(recipientAddress, 8, 8)}
            </p>
          </div>

          {userMemo && (
            <div className="ui-flex ui-items-start ui-justify-between ui-gap-2 ui-flex-wrap">
              <h5 className="ui-text-sm">Memo</h5>
              <p className="ui-text-sm ui-font-bold ui-max-w-[50%] ui-break-words ui-text-end">
                {userMemo}
              </p>
            </div>
          )}
        </div>

        <BaseButton
          onClick={() => handleConfirmClick()}
          className="ui-mt-8 ui-mb-10 sm:ui-mb-0"
        >
          CLOSE
        </BaseButton>
      </div>
    </>
  );
}
