import { ChangeEvent, useState } from "react";
import { DeliverTxResponse } from "@cosmjs/stargate";
import { ErrorDisplay } from "../ErrorDisplay";
import { useAbstraxionAccount } from "../../hooks";
import { isValidWalletAddress } from "../../utils";
import { usdcSearchDenom } from "../../hooks/useAccountBalance";
import { SelectedCurrency } from "./WalletSendTypes";
import { WalletSendInput } from "./WalletSendInput";
import { WalletSendReview } from "./WalletSendReview";
import { WalletSendSuccess } from "./WalletSendSuccess";

export function WalletSendForm({
  sendTokens,
  balanceInfo,
  setIsOpen,
}: {
  sendTokens: (
    senderAddress: string,
    sendAmount: number,
    denom: string,
    memo: string,
  ) => Promise<DeliverTxResponse>;
  balanceInfo: BalanceInfo;
  setIsOpen: any;
}) {
  const { data: account } = useAbstraxionAccount();

  const xionBalance = balanceInfo.balances.find(
    (coin) => coin.denom === "uxion",
  );
  const usdcBalance = balanceInfo.balances.find(
    (coin) => coin.denom === usdcSearchDenom,
  );

  const [selectedCurrency, setSelectedCurrency] = useState<SelectedCurrency>({
    type: "usdc",
    balance: usdcBalance,
    denom: usdcSearchDenom,
  });

  const [sendAmount, setSendAmount] = useState("0");
  const [amountError, setAmountError] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientAddressError, setRecipientAddressError] = useState("");
  const [userMemo, setUserMemo] = useState("");

  const [isOnReviewStep, setIsOnReviewStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sendTokensError, setSendTokensError] = useState(false);

  const [showDropdown, setShowDropdown] = useState(false);

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    setAmountError("");
    let inputValue = event.target.value;

    // replace commas in favor of zero.
    inputValue = inputValue.replace(/,/g, ".");

    // replace minus sign, negative values aren't allowed
    inputValue = inputValue.replace(/-/g, "");

    if (sendAmount === "0" && event.target.value === "00") return;
    if (!event.target.value) {
      setSendAmount("0");
      return;
    }

    // remove leading zeros, but allow for one before a decimal point
    inputValue = inputValue.replace(/^0+(?=\d)/, "");

    setSendAmount(inputValue);
  }

  function handleStart() {
    if (!sendAmount || sendAmount === "0") {
      setAmountError("No amount entered");
      return;
    }

    if (selectedCurrency.type === "xion") {
      if (Number(xionBalance?.amount) < Number(sendAmount) * 1000000) {
        setAmountError("Input is greater than your current balance");
        return;
      }
    }

    if (selectedCurrency.type === "usdc") {
      if (Number(usdcBalance?.amount) < Number(sendAmount) * 1000000) {
        setAmountError("Input is greater than your current balance");
        return;
      }
    }

    if (!isValidWalletAddress(recipientAddress)) {
      setRecipientAddressError("Invalid wallet address");
      return;
    }

    setIsOnReviewStep(true);
  }

  async function triggerSend() {
    try {
      setIsLoading(true);

      await sendTokens(
        recipientAddress,
        Number(sendAmount),
        selectedCurrency.denom,
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
      ) : (
        <WalletSendInput
          account={account}
          amountError={amountError}
          onChangeCurrency={setSelectedCurrency}
          onCloseDropdown={setShowDropdown}
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
          showDropdown={showDropdown}
          usdcBalance={usdcBalance}
          userMemo={userMemo}
          xionBalance={xionBalance}
          onStart={handleStart}
        />
      )}
    </>
  );
}
