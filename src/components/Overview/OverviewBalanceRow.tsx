import React from "react";
import { FormattedAssetAmount } from "../../types/assets";
import { Skeleton } from "../ui/skeleton";

export const OverviewBalanceRowSkeleton = () => {
  return (
    <div
      className="ui-flex ui-items-center ui-justify-between ui-w-full ui-px-2"
      role="listitem"
      aria-label={`skeleton balance information`}
    >
      <div className="ui-flex ui-items-center ui-gap-2 sm:ui-gap-3">
        <Skeleton className="ui-w-8 ui-h-8 ui-rounded-full" />
        <Skeleton className="ui-h-4 ui-w-16 md:ui-h-6 md:ui-w-24" />
      </div>
      <div className="ui-flex ui-items-center ui-gap-6 sm:ui-gap-16">
        <div
          className="ui-hidden md:ui-flex ui-flex-col ui-items-end ui-gap-1.5"
          aria-label={`skeleton current price information`}
        >
          <Skeleton
            className="ui-h-5 ui-w-16"
            aria-label={`Skeleton Current price`}
          />
          <Skeleton
            className="ui-h-3.5 ui-w-24"
            aria-label={`Skeleton Current price`}
          />
        </div>
        <div
          className="ui-flex ui-flex-col ui-items-end ui-gap-1.5"
          aria-label={`skeleton balance value information`}
        >
          <Skeleton
            className="ui-h-3.5 ui-w-12 md:ui-h-5 md:ui-w-16"
            aria-label={`Skeleton Total value`}
          />
          <Skeleton
            className="ui-h-3 ui-w-16 md:ui-h-3.5 md:ui-w-24"
            aria-label={`Skeleton Balance`}
          />
        </div>
      </div>
    </div>
  );
};

export const OverviewBalanceRow = ({
  asset,
}: {
  asset: FormattedAssetAmount;
}) => {
  return (
    <div
      className="ui-flex ui-items-center ui-justify-between ui-w-full ui-px-2"
      role="listitem"
      aria-label={`${asset.symbol} balance information`}
    >
      <div className="ui-flex ui-items-center ui-gap-2 sm:ui-gap-3">
        {asset.imageUrl && (
          <img
            src={asset.imageUrl}
            alt={`${asset.symbol} icon`}
            className="ui-w-8 ui-h-8 ui-rounded-full"
          />
        )}
        <h4 className="ui-text-base sm:ui-text-2xl ui-font-bold">
          {asset.symbol}
        </h4>
      </div>
      <div className="ui-flex ui-items-center ui-gap-6 sm:ui-gap-16">
        <div
          className="ui-hidden md:ui-flex ui-flex-col ui-items-end ui-gap-1.5"
          aria-label={`${asset.symbol} current price information`}
        >
          <p
            className="ui-text-base sm:ui-text-xl !ui-leading-none ui-font-bold"
            aria-label={`Current price ${asset.price.toFixed(2)} dollars`}
          >
            ${asset.price.toFixed(2)}
          </p>
          <p className="ui-text-xs sm:ui-text-sm !ui-leading-none ui-text-white/40">
            Current Price
          </p>
        </div>
        <div
          className="ui-flex ui-flex-col ui-items-end ui-gap-1.5"
          aria-label={`${asset.symbol} balance value information`}
        >
          <p
            className="ui-text-base sm:ui-text-xl !ui-leading-none ui-font-bold"
            aria-label={`Total value ${asset.dollarValue?.toFixed(2)} dollars`}
          >
            ${asset.dollarValue?.toFixed(2)}
          </p>
          <p
            className="ui-text-xs sm:ui-text-sm !ui-leading-none ui-text-white/40"
            aria-label={`Balance ${asset.value.toFixed(4)} ${asset.symbol}`}
          >
            {asset.value.toFixed(4)} {asset.symbol}
          </p>
        </div>
      </div>
    </div>
  );
};
