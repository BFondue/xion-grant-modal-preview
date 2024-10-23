import React from "react";
import { Button, ChevronDown, Input } from "@burnt-labs/ui";
import { SelectedCurrency } from "./WalletSendTypes";
import { XION_TO_USDC_CONVERSION } from "../Overview";
import { formatBalance } from "../../utils";
import { USDCIcon } from "../Icons/USDC";
import { XionIcon } from "../Icons/Xion";
import { SelectedSmartAccount } from "../../indexer-strategies/types";
import { usdcSearchDenom } from "../../hooks/useAccountBalance";
import { Coin } from "../../signers/types/generated/cosmos/base/v1beta1/coin";

interface WalletSendInputProps {
  selectedCurrency: SelectedCurrency;
  onChangeCurrency: React.Dispatch<React.SetStateAction<SelectedCurrency>>;
  xionBalance: Coin;
  usdcBalance: Coin;
  onCloseDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  showDropdown: boolean;
  sendAmount: string;
  amountError: string;
  onAmountChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  account: SelectedSmartAccount;
  recipientAddressError: string;
  recipientAddress: string;
  userMemo: string;
  onUpdateRecipientAddress: (address: string) => void;
  onUpdateUserMemo: (memo: string) => void;
  onStart: () => void;
  updateSendAmount: (amount: string) => void;
}

export function WalletSendInput({
  selectedCurrency,
  usdcBalance,
  onCloseDropdown: setShowDropdown,
  xionBalance,
  showDropdown,
  sendAmount,
  amountError,
  onAmountChange: handleAmountChange,
  account,
  recipientAddressError,
  recipientAddress,
  userMemo,
  onUpdateRecipientAddress,
  onUpdateUserMemo,
  onChangeCurrency,
  onStart,
  updateSendAmount,
}: WalletSendInputProps) {
  function switchSelectedCurrency(type: typeof selectedCurrency.type) {
    switch (type) {
      case "xion":
        onChangeCurrency({
          type: "xion",
          balance: xionBalance,
          denom: "uxion",
        });
        break;
      case "usdc":
        onChangeCurrency({
          type: "usdc",
          balance: usdcBalance,
          denom: usdcSearchDenom,
        });
        break;
    }
    updateSendAmount("0");
    setShowDropdown(false);
    return;
  }

  const currencyDropdown = () => {
    return (
      <div className="ui-relative">
        <div
          className={`ui-flex ui-items-center ui-justify-between ui-p-4 ui-bg-black ${
            showDropdown ? "ui-rounded-tr-lg ui-rounded-tl-lg" : "ui-rounded-lg"
          }`}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="ui-flex ui-items-center">
            <div className="ui-mr-2">
              {selectedCurrency.type === "usdc" ? <USDCIcon /> : <XionIcon />}
            </div>

            <div className="ui-flex ui-flex-col ui-items-start">
              <p className="ui-text-md ui-font-bold ui-text-white">
                {selectedCurrency.type.toUpperCase()}
              </p>
              <p className="ui-text-md ui-text-white">
                Balance:{" "}
                {formatBalance(Number(selectedCurrency.balance?.amount))}{" "}
                {selectedCurrency.type.toUpperCase()}{" "}
                <span className="ui-text-white/50 ui-pl-2">
                  $
                  {formatBalance(
                    Number(selectedCurrency.balance?.amount) *
                      (selectedCurrency.type === "xion"
                        ? XION_TO_USDC_CONVERSION
                        : 1),
                  )}{" "}
                  USD
                </span>
              </p>
            </div>
          </div>
          <ChevronDown isUp={showDropdown} />
        </div>

        <div
          className={`${
            showDropdown ? "ui-absolute ui-left-0" : "ui-hidden"
          } ui-w-full ui-rounded-bl-lg ui-rounded-br-lg ui-bg-black ui-border-t ui-border-white/20`}
        >
          <div
            className="ui-flex ui-items-center ui-p-4 ui-bg-black ui-rounded-lg"
            onClick={() => switchSelectedCurrency("xion")}
          >
            <div className="ui-mr-2">
              <XionIcon />
            </div>

            <div className="ui-flex ui-flex-col ui-items-start">
              <p className="ui-text-md ui-font-bold ui-text-white">XION</p>
              <p className="ui-text-md ui-text-white">
                Balance: {formatBalance(Number(xionBalance?.amount))} XION{" "}
                <span className="ui-text-white/50 ui-pl-2">
                  $
                  {formatBalance(
                    Number(xionBalance?.amount) * XION_TO_USDC_CONVERSION,
                  )}{" "}
                  USD
                </span>
              </p>
            </div>
          </div>

          <div
            className="ui-flex ui-items-center ui-p-4 ui-bg-black ui-rounded-lg ui-mt-1"
            onClick={() => switchSelectedCurrency("usdc")}
          >
            <div className="ui-mr-2">
              <USDCIcon />
            </div>

            <div className="ui-flex ui-flex-col ui-items-start">
              <p className="ui-text-md ui-font-bold ui-text-white">USDC</p>
              <p className="ui-text-md ui-text-white">
                Balance: {formatBalance(Number(usdcBalance?.amount))} USDC{" "}
                <span className="ui-text-white/50 ui-pl-2">
                  ${formatBalance(Number(usdcBalance?.amount))} USD
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="ui-flex ui-flex-col ui-p-0 ui-gap-8 ui-max-h-full ui-overflow-y-auto ui-mt-2">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          SEND
        </h1>
        <div className="ui-flex ui-flex-col">
          {currencyDropdown()}
          <div className="ui-font-akkuratLL ui-flex ui-justify-between ui-mb-4 ui-mt-8">
            <p className="ui-text-white ui-font-semibold">Amount</p>
            <p className="ui-text-white/50 ui-font-semibold">
              =$
              {formatBalance(
                Number(sendAmount) *
                  1000000 *
                  (selectedCurrency.type === "xion"
                    ? XION_TO_USDC_CONVERSION
                    : 1),
              )}{" "}
              USD
            </p>
          </div>
          <div
            className={`ui-flex ui-items-center ui-justify-between ui-p-6 ui-border ${
              amountError ? "ui-border-red-500" : "ui-border-white/50"
            } ui-rounded-lg`}
          >
            <input
              className={`ui-w-full ui-bg-transparent ${
                sendAmount === "0" && "!ui-text-[#6C6A6A]"
              } ui-text-white ui-font-bold ui-text-5xl placeholder:ui-text-white/50 focus:ui-outline-none`}
              onChange={(e) => {
                const value = e.target.value;
                if (selectedCurrency?.type === "xion") {
                  // Check if input is a number with up to 6 decimal places
                  const regex = /^\d*\.?\d{0,6}$/;

                  if (regex.test(value)) {
                    handleAmountChange(e);
                  }
                } else {
                  handleAmountChange(e);
                }
              }}
              placeholder="Amount"
              type="number"
              value={sendAmount}
            />
            <p className="ui-text-5xl ui-font-bold ui-text-white/50">
              {selectedCurrency.type.toUpperCase()}
            </p>
          </div>
          {amountError ? (
            <p className="ui-text-red-500 ui-text-sm">{amountError}</p>
          ) : null}
        </div>
        <div className="ui-flex ui-flex-col">
          <label className="ui-font-akkuratLL ui-text-xs ui-text-white/50">
            From:
          </label>
          <p className="ui-w-full ui-text-center ui-text-sm ui-font-akkuratLL ui-text-white ui-break-words">
            {account.id}
          </p>
        </div>
        <Input
          data-testid="recipient-input"
          error={recipientAddressError}
          onChange={(e) => {
            onUpdateRecipientAddress(e.target.value);
          }}
          placeholder="Recipient Address"
          value={recipientAddress}
        />
        <Input
          data-testid="memo-input"
          onChange={(e) => onUpdateUserMemo(e.target.value)}
          placeholder="Memo (Optional)"
          value={userMemo}
        />
        <Button onClick={onStart}>REVIEW</Button>
      </div>
    </>
  );
}
