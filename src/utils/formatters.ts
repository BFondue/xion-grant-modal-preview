import type { FormattedAssetAmount } from "../types/assets";

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
