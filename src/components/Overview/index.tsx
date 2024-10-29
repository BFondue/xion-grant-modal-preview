import { useState } from "react";
import type { SmartAccount } from "../../indexer-strategies/types";
import { useAccountBalance } from "../../hooks/useAccountBalance";
import { RightArrowIcon, ScanIcon } from "../Icons";
import { WalletSend } from "../WalletSend/WalletSend";
import { WalletReceive } from "../WalletReceive";
import { Divider } from "./Divider";
import { OverviewBalanceRow } from "./OverviewBalanceRow";
import { FEATURED_ASSETS } from "../../config";
import { isMainnet } from "../../utils";

export const Overview = ({ account }: { account?: SmartAccount }) => {
  const [showAllBalances, setShowAllBalances] = useState(false);
  const { balances, totalDollarValue, sendTokens } = useAccountBalance(
    isMainnet ? "mainnet" : "testnet",
  );

  const toggleShowAllBalances = () => {
    setShowAllBalances((currentState) => !currentState);
  };

  const featuredAssetsSet = new Set(FEATURED_ASSETS);
  const splitBalances = balances.reduce(
    (acc, balance) => {
      if (
        featuredAssetsSet.has(
          balance.symbol as (typeof FEATURED_ASSETS)[number],
        )
      ) {
        acc.featuredBalances.push(balance);
      } else {
        acc.otherBalances.push(balance);
      }
      return acc;
    },
    { featuredBalances: [], otherBalances: [] } as {
      featuredBalances: typeof balances;
      otherBalances: typeof balances;
    },
  );

  return (
    <div
      style={{
        backgroundImage: `url('/overviewBackground.png')`,
      }}
      className="ui-w-full ui-bg-cover ui-bg-no-repeat ui-bg-center ui-rounded-2xl ui-p-6 bg-fixed"
    >
      <div className="ui-mb-6 ui-flex ui-items-center">
        <h1 className="ui-font-akkuratLL ui-mr-6 ui-text-2xl ui-font-bold ui-leading-7 ui-text-white">
          Personal Account
        </h1>
        {/* <ScanIcon color="white" /> */}
      </div>
      <h3 className="ui-font-akkuratLL ui-text-sm ui-text-white/50 ui-mb-2">
        Current Balance
      </h3>
      <div className="ui-flex ui-items-center ui-justify-between">
        {balances && (
          <h1 className="ui-font-akkuratLL ui-leading-wide ui-text-4xl ui-font-bold ui-text-white">
            ${totalDollarValue.toFixed(2)}
          </h1>
        )}
        {/* Hidden until functionality is in place. */}
        <div className="ui-flex">
          {/* <div className="w-12 h-12 bg-black rounded-full flex justify-center items-center mr-6">
            <ScanIcon color="white" />
          </div> */}
          {account?.id && (
            <WalletReceive
              xionAddress={account.id}
              trigger={
                <div className="ui-mr-4 ui-flex ui-h-12 ui-w-12 ui-items-center ui-justify-center ui-rounded-full ui-bg-black hover:ui-cursor-pointer">
                  <ScanIcon color="white" />
                </div>
              }
            />
          )}
          <WalletSend
            trigger={
              <div className="ui-flex ui-h-12 ui-w-12 ui-items-center ui-justify-center ui-rounded-full ui-bg-black hover:ui-cursor-pointer">
                <RightArrowIcon color="white" />
              </div>
            }
          />
        </div>
      </div>
      <Divider />
      {splitBalances.featuredBalances.map((balance) => (
        <OverviewBalanceRow
          key={balance.symbol}
          label={balance.symbol}
          asset={balance}
        />
      ))}
      {splitBalances.otherBalances.length > 0 && (
        <>
          {" "}
          <div>
            {showAllBalances &&
              splitBalances.otherBalances.map((balance) => (
                <OverviewBalanceRow
                  key={balance.symbol}
                  label={balance.symbol}
                  asset={balance}
                />
              ))}
          </div>
          <div className="ui-flex ui-items-center ui-justify-between ui-mt-2">
            <div className="ui-text-white/40 ui-text-base font-normal font-['Akkurat LL'] leading-normal">
              {showAllBalances
                ? `${balances.length} items`
                : `+${splitBalances.otherBalances.length} more`}
            </div>
            <div
              onClick={toggleShowAllBalances}
              className="text-right text-white text-sm font-normal font-['Akkurat LL'] underline leading-tight hover:ui-cursor-pointer ui-underline"
            >
              {showAllBalances ? "Show less" : "Show all"}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
