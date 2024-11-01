import React, { useState } from "react";
import { Button, Input, ChevronDown } from "@burnt-labs/ui";
import { SelectedSmartAccount } from "../../indexer-strategies/types";
import type { FormattedAssetAmount } from "../../types/assets";

interface WalletSendInputProps {
  selectedCurrency: FormattedAssetAmount;
  balances: FormattedAssetAmount[];
  onChangeCurrency: React.Dispatch<React.SetStateAction<string>>;
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
  balances,
  selectedCurrency,
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
  const [showDropdown, setShowDropdown] = useState(false);

  function switchSelectedCurrency(selectedDenom: string) {
    onChangeCurrency(selectedDenom);
    updateSendAmount("");
    setShowDropdown(false);
    return;
  }

  const currencyDropdown = () => {
    return (
      <div className="ui-relative">
        <div
          className={`ui-flex ui-items-center ui-justify-between ui-p-4 ui-bg-black hover:ui-cursor-pointer hover:ui-bg-white/10 ${
            showDropdown ? "ui-rounded-tr-lg ui-rounded-tl-lg" : "ui-rounded-lg"
          }`}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <div className="ui-flex ui-items-center">
            <div className="ui-mr-2">
              <img
                className="ui-w-[40px] ui-h-[40px] ui-mr-3"
                src={selectedCurrency.imageUrl}
              />
            </div>

            <div className="ui-flex ui-flex-col ui-items-start">
              <p className="ui-text-md ui-font-bold ui-text-white">
                {selectedCurrency.symbol.toUpperCase()}
              </p>
              <p className="ui-text-md ui-text-white">
                Balance: {selectedCurrency.value}{" "}
                {selectedCurrency.symbol.toUpperCase()}
                <span className="ui-text-white/50 ui-pl-2">
                  ${selectedCurrency.dollarValue.toFixed(2)} USD
                </span>
              </p>
            </div>
          </div>
          <ChevronDown isUp={showDropdown} />
        </div>

        {/* Dropdown Values - iterate over balances that are not the selected currency */}
        <div
          className={`${
            showDropdown ? "ui-absolute ui-left-0" : "ui-hidden"
          } ui-w-full ui-rounded-bl-lg ui-rounded-br-lg ui-bg-black ui-border-t ui-border-white/20`}
        >
          {balances.map((balance) => {
            if (balance.symbol === selectedCurrency.symbol) return null;
            return (
              <div
                className="ui-flex ui-items-center ui-p-4 ui-bg-black ui-rounded-lg hover:ui-cursor-pointer hover:ui-bg-white/10"
                onClick={() => switchSelectedCurrency(balance.asset.base)}
              >
                <div className="ui-mr-2">
                  <img
                    className="ui-w-[40px] ui-h-[40px] ui-mr-3"
                    src={balance.imageUrl}
                  />
                </div>

                <div className="ui-flex ui-flex-col ui-items-start">
                  <p className="ui-text-md ui-font-bold ui-text-white">
                    {balance.symbol.toUpperCase()}
                  </p>
                  <p className="ui-text-md ui-text-white">
                    Balance: {balance.value} {balance.symbol.toUpperCase()}
                    <span className="ui-text-white/50 ui-pl-2">
                      ${balance.dollarValue.toFixed(2)} USD
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {/* End Dropdown Values */}
      </div>
    );
  };

  return (
    <>
      <div className="ui-flex ui-flex-col ui-p-0 ui-gap-y-4 ui-max-h-full ui-overflow-y-auto">
        <h1 className="ui-w-full ui-text-center ui-text-3xl ui-font-akkuratLL ui-font-thin">
          SEND
        </h1>
        <div className="ui-flex ui-flex-col">
          {currencyDropdown()}
          <div className="ui-font-akkuratLL ui-flex ui-justify-between ui-mb-4 ui-mt-8">
            <p className="ui-text-white ui-font-semibold">Amount</p>
            <p className="ui-text-white/50 ui-font-semibold">
              =$
              {Number(sendAmount) * selectedCurrency.price} USD
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
                handleAmountChange(e);
              }}
              placeholder="0"
              type="number"
              inputMode="numeric"
              value={sendAmount}
            />
            <p className="ui-text-5xl ui-font-bold ui-text-white/50">
              {selectedCurrency.symbol.toUpperCase()}
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
