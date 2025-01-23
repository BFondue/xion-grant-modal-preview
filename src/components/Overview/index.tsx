import React, { useState } from "react";
import { RightArrowIcon, ScanIcon } from "../ui";
import type { SmartAccount } from "../../indexer-strategies/types";
import { useAccountBalance } from "../../hooks/useAccountBalance";
import { WalletSend } from "../WalletSend/WalletSend";
import { WalletReceive } from "../WalletReceive";
import { Divider } from "./Divider";
import { OverviewBalanceRow } from "./OverviewBalanceRow";
import { FEATURED_ASSETS } from "../../config";
import { isMainnet } from "../../utils";

export const Overview = ({ account }: { account?: SmartAccount }) => {
  const [showAllBalances, setShowAllBalances] = useState(false);
  const { balances, totalDollarValue } = useAccountBalance(
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
      <h3 className="ui-text-2xl ui-font-bold ui-leading-7 ui-text-white ui-mb-6">
        Personal Account
      </h3>
      <div className="ui-w-full ui-flex ui-flex-col ui-justify-between ui-items-end ui-gap-6 sm:ui-flex-row">
        <div className="ui-flex ui-flex-col ui-gap-3">
          <h6 className="ui-text-sm ui-leading-4 ui-text-white/50">
            Current Balance
          </h6>
          {balances && (
            <h1 className="ui-text-[40px] ui-leading-[36px] ui-font-bold">
              ${totalDollarValue.toFixed(2)}
            </h1>
          )}
        </div>
        <div className="ui-flex ui-gap-4 md:ui-gap-6">
          {account?.id && (
            <WalletReceive
              xionAddress={account.id}
              trigger={
                <div className="ui-flex ui-h-12 ui-w-12 ui-items-center ui-justify-center ui-rounded-full ui-bg-black hover:ui-cursor-pointer">
                  <ScanIcon color="white" />
                </div>
              }
            />
          )}
          <WalletSend
            trigger={
              <div className="ui-flex ui-h-12 ui-w-12 ui-items-center ui-justify-center ui-rounded-full ui-bg-black hover:ui-cursor-pointer -ui-rotate-45">
                <RightArrowIcon color="white" />
              </div>
            }
          />
        </div>
      </div>
      <Divider className="ui-my-6" />
      <div className="ui-flex ui-flex-col ui-gap-3">
        {splitBalances.featuredBalances.map((balance) => (
          <OverviewBalanceRow
            key={balance.symbol}
            label={balance.symbol}
            asset={balance}
          />
        ))}
      </div>
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
            <div className="ui-text-white/40 ui-text-base font-normal leading-normal">
              {showAllBalances
                ? `${balances.length} items`
                : `+${splitBalances.otherBalances.length} more`}
            </div>
            <div
              onClick={toggleShowAllBalances}
              className="text-right text-white text-sm font-normal underline leading-tight hover:ui-cursor-pointer ui-underline"
            >
              {showAllBalances ? "Show less" : "Show all"}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
