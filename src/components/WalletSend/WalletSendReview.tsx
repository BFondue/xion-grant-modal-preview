import {
  BaseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui";
import { SelectedSmartAccount } from "../../types/wallet-account-types";
import { FormattedAssetAmount } from "../../types/assets";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import { ChevronRightIcon } from "../ui/icons/ChevronRight";
import { truncateAddress } from "../../utils";
import { cn } from "../../utils/classname-util";
import { InteractiveTooltip } from "../ui/tooltip";
import { ExternalLinkIcon } from "../ui/icons/ExternalLink";
import { WarningIcon } from "../ui/icons";
import { getExplorerAddressUrl } from "../../config";

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
      <div className="ui-p-0 ui-flex ui-flex-col ui-gap-8 ui-max-h-full ui-h-full">
        <DialogHeader>
          <DialogTitle>Review</DialogTitle>
          <DialogDescription>
            You are about to make the transaction below.
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
                    {selectedCurrency.symbol.toUpperCase()}
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
            <InteractiveTooltip
              content={
                <a
                  href={getExplorerAddressUrl(account.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-text-sm ui-text-[#D1D5DB] hover:ui-underline ui-inline-block"
                >
                  <span className="ui-break-all ui-inline">{account.id}</span>
                  <ExternalLinkIcon
                    size={16}
                    className="ui-inline-block ui-align-text-bottom ui-ml-1"
                  />
                </a>
              }
            >
              <p className="ui-text-sm ui-font-bold">
                {truncateAddress(account.id, 8, 8)}
              </p>
            </InteractiveTooltip>
          </div>

          <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
            <h5 className="ui-text-sm">To</h5>
            <InteractiveTooltip
              content={
                <a
                  href={getExplorerAddressUrl(recipientAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-text-sm ui-text-[#D1D5DB] hover:ui-underline ui-inline-block"
                >
                  <span className="ui-break-all ui-inline">
                    {recipientAddress}
                  </span>
                  <ExternalLinkIcon
                    size={16}
                    className="ui-inline-block ui-align-text-bottom ui-ml-1"
                  />
                </a>
              }
            >
              <p className="ui-text-sm ui-font-bold">
                {truncateAddress(recipientAddress, 8, 8)}
              </p>
            </InteractiveTooltip>
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

        {/* USDC on Xion is not supported by exchanges, the below renders a small warning message for the user */}
        {selectedCurrency.symbol === "USDC" && (
          <div className="ui-w-full ui-p-4 ui-bg-[#2d1600] ui-border ui-border-[#ff9800] ui-rounded-xl">
            <div className="ui-flex ui-items-center ui-gap-2">
              <WarningIcon className="ui-h-5 ui-w-5 ui-text-[#ff9800] ui-flex-shrink-0" />
              <p className="ui-text-sm ui-font-medium ui-text-[#ffb74d] ui-text-center">
                Centralized exchanges may not support this type of asset. Avoid
                transferring to centralized exchanges.
              </p>
            </div>
          </div>
        )}

        <div className="ui-flex ui-gap-3">
          <BaseButton
            variant="secondary"
            size="icon-large"
            className={cn("ui-group/basebutton", {
              "ui-opacity-50 ui-cursor-not-allowed": isLoading,
            })}
            onClick={handleBackClick}
            disabled={isLoading}
          >
            <div className="ui-flex ui-items-center ui-justify-center">
              <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
              <ChevronRightIcon className="ui-fill-white/50 ui-rotate-180 group-hover/basebutton:ui-fill-white" />
            </div>
          </BaseButton>
          <BaseButton
            disabled={isLoading}
            onClick={handleProceedClick}
            className="ui-w-full"
          >
            {isLoading ? <SpinnerV2 size="sm" color="black" /> : "CONFIRM"}
          </BaseButton>
        </div>
      </div>
    </>
  );
}
