import { describe, it, expect } from "vitest";
import { basicFormatCurrency, basicFormatTokenAmount } from "./index";
import type { FormattedAssetAmount, Asset } from "../types/assets";

const minimalAsset: Asset = {
  denom_units: [{ denom: "tst", exponent: 0 }],
  type_asset: "sdk.coin",
  base: "base",
  name: "Test Asset",
  display: "Test",
  symbol: "TST",
};

describe("basicFormatCurrency", () => {
  it("formats number with default 2 decimals", () => {
    expect(basicFormatCurrency(1234.567)).toBe("1,234.57");
  });

  it("formats number with 0 decimals", () => {
    expect(basicFormatCurrency(1234.567, 0)).toBe("1,235");
  });

  it("formats number with 4 decimals", () => {
    expect(basicFormatCurrency(1234.56789, 4)).toBe("1,234.5679");
  });
});

describe("basicFormatTokenAmount", () => {
  const usdcAsset: FormattedAssetAmount = {
    value: 1234.567,
    display: "USDC",
    symbol: "USDC",
    baseAmount: "1234567",
    displayAmount: "1234.567",
    asset: minimalAsset,
    decimals: 6,
    price: 1,
    imageUrl: "",
  };

  const otherAsset: FormattedAssetAmount = {
    value: 1234.56789,
    display: "ATOM",
    symbol: "ATOM",
    baseAmount: "123456789",
    displayAmount: "1234.56789",
    asset: minimalAsset,
    decimals: 6,
    price: 10,
    imageUrl: "",
  };

  it("formats USDC with 2 decimals", () => {
    expect(basicFormatTokenAmount(usdcAsset)).toBe("1,234.57");
  });

  it("formats non-USDC with 4 decimals", () => {
    expect(basicFormatTokenAmount(otherAsset)).toBe("1,234.5679");
  });
});
