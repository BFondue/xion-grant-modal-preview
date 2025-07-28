import { parseCoinString } from "@burnt-labs/abstraxion-core";
import type { FormattedAssetAmount } from "../types/assets";
import { USDC_DENOM } from "../config";

export const basicFormatCurrency = (value: number, decimals: number = 2) => {
  const locale = detectUserLocale();
  return value.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const basicFormatTokenAmount = (asset: FormattedAssetAmount) => {
  if (asset.symbol === "USDC") {
    return basicFormatCurrency(asset.value, 2);
  }
  return basicFormatCurrency(asset.value, 4);
};

export const detectUserLocale = (): string => {
  if (typeof navigator !== "undefined") {
    return navigator.language || navigator.languages?.[0] || "en-US";
  }

  if (typeof process !== "undefined") {
    return process.env.LANG?.split(".")[0].replace("_", "-") || "en-US";
  }

  return "en-US";
};

export const DENOM_DECIMALS = {
  xion: 6,
  usdc: 6,
} as const;

export const DENOM_DISPLAY_MAP = {
  xion: "XION",
  usdc: "USDC",
} as const;

/**
 * Formats a coin string (e.g. "1000000uxion") into a human readable format (e.g. "1 XION")
 * Can handle multiple coins separated by commas
 * @param coinStr The coin string to format
 * @returns Formatted string of coins
 */
export function formatCoins(coinStr: string): string {
  if (!coinStr) return "";

  const formattedCoins = coinStr.split(",").map((singleCoin) => {
    const coin = parseCoinString(singleCoin)[0];
    if (!coin) return "";

    // Handle special case for USDC
    if (coin.denom === USDC_DENOM) {
      const amount = Number(coin.amount) / Math.pow(10, DENOM_DECIMALS.usdc);
      return `${amount} ${DENOM_DISPLAY_MAP.usdc}`;
    }

    // Handle regular denoms
    const baseDenom = coin.denom.startsWith("u")
      ? coin.denom.slice(1)
      : coin.denom;

    // Check if it's a known denom
    if (baseDenom in DENOM_DECIMALS) {
      // Only convert if the denom starts with 'u'
      if (coin.denom.startsWith("u")) {
        const decimals =
          DENOM_DECIMALS[baseDenom as keyof typeof DENOM_DECIMALS];
        const amount = Number(coin.amount) / Math.pow(10, decimals);
        const displayDenom =
          DENOM_DISPLAY_MAP[baseDenom as keyof typeof DENOM_DISPLAY_MAP] ??
          baseDenom.toUpperCase();
        return `${amount} ${displayDenom}`;
      }
    }

    // For unknown denoms, try to make a best effort to format them nicely
    return `${coin.amount} ${coin.denom.toUpperCase()}`;
  });

  return formattedCoins.filter(Boolean).join(", ");
}
