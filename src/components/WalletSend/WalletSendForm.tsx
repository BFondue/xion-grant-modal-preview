import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { ErrorDisplay } from "../ErrorDisplay";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../../hooks";
import { isValidWalletAddress } from "../../utils";
import { WalletSendInput } from "./WalletSendInput";
import { WalletSendReview } from "./WalletSendReview";
import { WalletSendSuccess } from "./WalletSendSuccess";
import { useAccountBalance } from "../../hooks/useAccountBalance";
import { WalletSendWarning } from "./WalletSendWarning";

export function WalletSendForm({
  setIsOpen,
}: {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { data: account } = useAbstraxionAccount();
  const { balances, sendTokens, getBalanceByDenom } = useAccountBalance();

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
  const [transactionHash, setTransactionHash] = useState("");

  const client = useAbstraxionSigningClient();

  const validateAmount = useCallback(() => {
    if (!sendAmount || sendAmount === "0") {
      return;
    }

    if (selectedCurrency?.value === undefined) {
      setAmountError("Selected currency value is undefined");
      return;
    } else if (Number(sendAmount) > selectedCurrency.value) {
      setAmountError("Input is greater than your current balance");
      return;
    } else {
      setAmountError("");
    }
  }, [sendAmount, selectedCurrency?.value]);

  function updateSendAmount(inputValue: string) {
    // replace commas with periods for decimal input
    inputValue = inputValue.replace(/,/g, ".");

    // remove any non-numeric characters except for the decimal point
    inputValue = inputValue.replace(/[^0-9.]/g, "");

    // ensure only one decimal point is present
    const parts = inputValue.split(".");
    if (parts.length > 2) {
      inputValue = parts[0] + "." + parts.slice(1).join("");
    }

    // limit decimal places to the number of decimals for the selected asset
    if (
      parts.length === 2 &&
      selectedCurrency &&
      selectedCurrency.decimals !== undefined
    ) {
      const decimals = selectedCurrency.decimals;
      if (parts[1].length > decimals) {
        parts[1] = parts[1].substring(0, decimals);
        inputValue = parts[0] + (decimals > 0 ? "." + parts[1] : "");
      }
    }

    // If input is empty, set sendAmount to an empty string
    if (!inputValue) {
      setSendAmount("");
      setAmountError("");
    } else {
      setSendAmount(inputValue);
    }
  }

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const inputValue = event.target.value;

    updateSendAmount(inputValue);
  }

  // Debounce the amount validation
  useEffect(() => {
    const timer = setTimeout(() => {
      validateAmount();
    }, 500);

    return () => clearTimeout(timer);
  }, [sendAmount, validateAmount]);

  async function isExistingAddress(address: string) {
    try {
      return await client?.client?.getAccount(address);
    } catch {
      setIsOnWarningStep(true);
      return false;
    }
  }

  function checkSendAmountInput() {
    if (
      selectedCurrency?.value &&
      Number(sendAmount) > selectedCurrency.value &&
      sendAmount !== ""
    ) {
      setAmountError("Input is greater than your current balance");
      return false;
    } else if (
      selectedCurrency?.value &&
      sendAmount &&
      Number(sendAmount) < selectedCurrency.value
    ) {
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

      if (!selectedCurrency?.asset.base) {
        throw new Error("Selected currency asset base is undefined");
      }

      const result = await sendTokens(
        recipientAddress,
        Number(sendAmount),
        selectedCurrency.asset.base,
        userMemo,
      );

      if (result.transactionHash) {
        setTransactionHash(result.transactionHash);
      }

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
          description="Transaction failed. Please try again later."
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
          transactionHash={transactionHash}
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
