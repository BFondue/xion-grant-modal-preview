import React, { ChangeEvent, useEffect, useState } from "react";
import { ErrorDisplay } from "../ErrorDisplay";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../../hooks";
import { isValidWalletAddress } from "../../utils";
import { WalletSendInput } from "./WalletSendInput";
import { WalletSendReview } from "./WalletSendReview";
import { WalletSendSuccess } from "./WalletSendSuccess";
import { useAccountBalance } from "../../hooks/useAccountBalance";
import { isMainnet } from "../../utils";
import { WalletSendWarning } from "./WalletSendWarning";

export function WalletSendForm({
  setIsOpen,
}: {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { data: account } = useAbstraxionAccount();
  const { balances, sendTokens, getBalanceByDenom } = useAccountBalance(
    isMainnet ? "mainnet" : "testnet",
  );

  const [selectedCurrencyDenom, setSelectedCurrencyDenom] = useState("uxion");
  const selectedCurrency = getBalanceByDenom(selectedCurrencyDenom);

  const [sendAmount, setSendAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientAddressError, setRecipientAddressError] = useState("");
  const [userMemo, setUserMemo] = useState("");

  const [isOnReviewStep, setIsOnReviewStep] = useState(false);
  const [isOnWarningStep, setIsOnWarningStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sendTokensError, setSendTokensError] = useState(false);

  const client = useAbstraxionSigningClient();

  function updateSendAmount(inputValue: string) {
    setAmountError("");

    // replace commas with periods for decimal input
    inputValue = inputValue.replace(/,/g, ".");

    // remove any non-numeric characters except for the decimal point
    inputValue = inputValue.replace(/[^0-9.]/g, "");

    // ensure only one decimal point is present
    const parts = inputValue.split(".");
    if (parts.length > 2) {
      inputValue = parts[0] + "." + parts.slice(1).join("");
    }

    // If input is empty, set sendAmount to an empty string
    if (!inputValue) {
      setSendAmount("");
    } else {
      setSendAmount(inputValue);
    }
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const inputValue = event.target.value;

    updateSendAmount(inputValue);
  }

  async function isExistingAddress(address: string) {
    try {
      return await client.client.getAccount(address);
    } catch {
      setIsOnWarningStep(true);
      return false;
    }
  }

  function checkSendAmountInput() {
    if (Number(sendAmount) > selectedCurrency.value && sendAmount !== "") {
      setAmountError("Input is greater than your current balance");
      return false;
    } else if (sendAmount && Number(sendAmount) < selectedCurrency.value) {
      setAmountError("");
      return true;
    }

    return true;
  }

  function checkRecipientAddressInput() {
    if (!isValidWalletAddress(recipientAddress)) {
      setRecipientAddressError("Invalid wallet address");
      return false;
    }

    return true;
  }

  async function handleStart() {
    if (!sendAmount || sendAmount === "0") {
      setAmountError("No amount entered");
      return;
    }

    if (!checkSendAmountInput()) {
      return;
    }

    if (!checkRecipientAddressInput()) {
      return;
    }

    const addressExists = await isExistingAddress(recipientAddress);

    if (!addressExists) {
      setIsOnWarningStep(true);
      return;
    }

    setIsOnReviewStep(true);
  }

  async function triggerSend() {
    try {
      setIsLoading(true);
      await handleStart();

      await sendTokens(
        recipientAddress,
        Number(sendAmount),
        selectedCurrency.asset.base,
        userMemo,
      );
      setIsSuccess(true);
    } catch (error) {
      console.log(error);
      setSendTokensError(true);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    checkSendAmountInput();
  }, [sendAmount]);

  useEffect(() => {
    checkRecipientAddressInput();
  }, [recipientAddress]);

  return (
    <>
      {sendTokensError ? (
        <ErrorDisplay
          title="ERROR!"
          message="Transaction failed. Please try again later."
          onClose={() => setIsOpen(false)}
        />
      ) : isSuccess ? (
        <WalletSendSuccess
          account={account}
          onFinish={() => setIsOpen(false)}
          recipientAddress={recipientAddress}
          selectedCurrency={selectedCurrency}
          sendAmount={sendAmount}
          userMemo={userMemo}
        />
      ) : isOnReviewStep ? (
        <WalletSendReview
          isLoading={isLoading}
          account={account}
          recipientAddress={recipientAddress}
          selectedCurrency={selectedCurrency}
          sendAmount={sendAmount}
          userMemo={userMemo}
          triggerSend={triggerSend}
          onBack={() => {
            setIsOnReviewStep(false);
          }}
        />
      ) : isOnWarningStep ? (
        <WalletSendWarning
          onContinue={() => {
            setIsOnWarningStep(false);
            setIsOnReviewStep(true);
          }}
          onCancel={() => setIsOnWarningStep(false)}
        />
      ) : (
        <WalletSendInput
          account={account}
          balances={balances}
          amountError={amountError}
          onChangeCurrency={setSelectedCurrencyDenom}
          selectedCurrencyDenom={selectedCurrencyDenom}
          onAmountChange={handleAmountChange}
          onUpdateRecipientAddress={(e) => {
            setRecipientAddressError("");
            setRecipientAddress(e);
          }}
          onUpdateUserMemo={setUserMemo}
          recipientAddress={recipientAddress}
          recipientAddressError={recipientAddressError}
          selectedCurrency={selectedCurrency}
          sendAmount={sendAmount}
          userMemo={userMemo}
          onStart={handleStart}
          updateSendAmount={updateSendAmount}
        />
      )}
    </>
  );
}
