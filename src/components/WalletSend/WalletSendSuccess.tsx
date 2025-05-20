import React, { useContext } from "react";
import {
  BaseButton,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui";
import type { FormattedAssetAmount } from "../../types/assets";
import { SelectedSmartAccount } from "../../indexer-strategies/types";
import { truncateAddress } from "../../utils";
import { InteractiveTooltip } from "../ui/tooltip";
import { ExternalLinkIcon } from "../ui/icons/ExternalLink";
import { Link } from "react-router-dom";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";

interface WalletSendSuccessProps {
  sendAmount: string;
  selectedCurrency: FormattedAssetAmount;
  userMemo: string;
  account: SelectedSmartAccount;
  recipientAddress: string;
  onFinish: () => void;
  transactionHash: string;
}

export function WalletSendSuccess({
  sendAmount,
  selectedCurrency,
  userMemo,
  account,
  recipientAddress,
  onFinish,
  transactionHash,
}: WalletSendSuccessProps) {
  const handleConfirmClick = () => {
    onFinish();
  };

  const { isMainnet, chainInfo } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

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

        <div className="ui-flex ui-flex-col ui-gap-4">
          <div className="ui-flex ui-flex-col ui-gap-5 ui-p-5 ui-rounded-lg ui-bg-black/50">
            <div className="ui-flex ui-items-center ui-justify-between ui-gap-2">
              <h5 className="ui-text-sm">From</h5>
              <InteractiveTooltip
                content={
                  <Link
                    to={
                      isMainnet
                        ? `https://www.mintscan.io/xion/address/${account.id}`
                        : chainInfo?.chainId === "xion-testnet-2"
                          ? `https://www.mintscan.io/xion-testnet/address/${account.id}`
                          : `https://explorer.burnt.com/xion-testnet-1/address/${account.id}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ui-text-sm ui-text-[#D1D5DB] hover:ui-underline ui-inline-block"
                  >
                    <span className="ui-break-all ui-inline">{account.id}</span>
                    <ExternalLinkIcon
                      size={16}
                      className="ui-inline-block ui-align-text-bottom ui-ml-1"
                    />
                  </Link>
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
                  <Link
                    to={
                      isMainnet
                        ? `https://www.mintscan.io/xion/address/${recipientAddress}`
                        : chainInfo?.chainId === "xion-testnet-2"
                          ? `https://www.mintscan.io/xion-testnet/address/${recipientAddress}`
                          : `https://explorer.burnt.com/xion-testnet-1/address/${recipientAddress}`
                    }
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
                  </Link>
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

          <div className="ui-flex ui-flex-col ui-gap-5 ui-p-5 ui-rounded-lg ui-bg-black/50">
            <div className="ui-flex ui-justify-between ui-gap-2">
              <p className="ui-text-sm">Transaction Link</p>
              <Link
                to={
                  isMainnet
                    ? `https://www.mintscan.io/xion/tx/${transactionHash}`
                    : chainInfo?.chainId === "xion-testnet-2"
                      ? `https://www.mintscan.io/xion-testnet/tx/${transactionHash}`
                      : `https://explorer.burnt.com/xion-testnet-1/tx/${transactionHash}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="ui-text-sm ui-text-white hover:ui-underline ui-inline-block"
              >
                View on Explorer
                <ExternalLinkIcon
                  size={16}
                  className="ui-inline-block ui-align-text-bottom ui-ml-1"
                />
              </Link>
            </div>
          </div>
        </div>

        <BaseButton
          onClick={() => handleConfirmClick()}
          className="ui-mt-2 ui-mb-10 sm:ui-mb-0"
        >
          CLOSE
        </BaseButton>
      </div>
    </>
  );
}
