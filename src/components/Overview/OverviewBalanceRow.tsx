import React from "react";
import { FormattedAssetAmount } from "../../types/assets";

export const OverviewBalanceRow = ({
  label = "",
  asset,
}: {
  label: string;
  asset: FormattedAssetAmount;
}) => {
  return (
    <div className="ui-flex ui-items-center ui-justify-between">
      <p className="ui-text-white ui-hidden sm:ui-block">{label}</p>
      <p className="ui-text-white sm:ui-hidden">
        {asset.value} {asset.symbol}
      </p>
      <div className="ui-flex ui-flex-col ui-justify-end ui-items-end ui-gap-0.5 sm:ui-flex-row sm:ui-items-start sm:ui-gap-3">
        <p className="ui-text-base ui-font-bold ui-text-white ui-text-right ui-hidden sm:ui-block">
          {asset.value} {asset.symbol}
        </p>
        <p className="ui-flex ui-text-right ui-text-base ui-text-white/70">
          ${asset.dollarValue.toFixed(2)} USD
        </p>
      </div>
    </div>
  );
};
