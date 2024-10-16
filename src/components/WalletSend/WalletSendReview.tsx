import { Button } from "@burnt-labs/ui";
import { SelectedCurrency } from "./WalletSendTypes";
import { XION_TO_USDC_CONVERSION } from "../Overview";
import { formatBalance } from "../../utils";
import { SelectedSmartAccount } from "../../indexer-strategies/types";

interface WalletSendReviewProps {
  sendAmount: string;
  selectedCurrency: SelectedCurrency;
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
      <div className="ui-p-0 ui-flex ui-flex-col ui-gap-4">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          REVIEW
        </h1>
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
          You are about to make the transaction below.
        </p>
        <div className="ui-my-6 ui-h-[1px] ui-w-full ui-bg-white/20" />
        <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white/40">
          Transfer Amount
        </p>
        <p className="ui-w-full ui-text-center ui-text-4xl ui-font-akkuratLL ui-text-white ui-font-semibold">
          {sendAmount}{" "}
          <span className="ui-text-white/40">
            {selectedCurrency.type.toUpperCase()}
          </span>
        </p>
        <p className="ui-w-full ui-text-center ui-text-md ui-font-akkuratLL ui-text-white/40">
          $
          {formatBalance(
            Number(sendAmount) *
              1000000 *
              (selectedCurrency.type === "xion" ? XION_TO_USDC_CONVERSION : 1),
          )}{" "}
          USD
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
        <Button disabled={isLoading} onClick={handleProceedClick}>
          {isLoading ? "Loading..." : "CONFIRM"}
        </Button>
        <Button
          disabled={isLoading}
          onClick={handleBackClick}
          structure="naked"
        >
          GO BACK
        </Button>
      </div>
    </>
  );
}
