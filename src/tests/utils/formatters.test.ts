import { describe, it, expect, afterEach } from "vitest";
import {
  basicFormatCurrency,
  basicFormatTokenAmount,
  detectUserLocale,
  formatCoins,
  DENOM_DECIMALS,
} from "../../utils/formatters";
import type { FormattedAssetAmount, Asset } from "../../types/assets";
import { USDC_DENOM } from "../../config";

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

describe("detectUserLocale", () => {
  const originalNavigator = global.navigator;
  const originalProcess = global.process;

  afterEach(() => {
    global.navigator = originalNavigator;
    global.process = originalProcess;
  });

  it("returns navigator.language if available", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: "fr-FR", languages: ["fr-FR"] },
      writable: true,
      configurable: true,
    });
    expect(detectUserLocale()).toBe("fr-FR");
  });

  it("returns first of navigator.languages if language is not available", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: undefined, languages: ["es-ES"] },
      writable: true,
      configurable: true,
    });
    expect(detectUserLocale()).toBe("es-ES");
  });

  it("returns process.env.LANG if navigator is undefined", () => {
    // @ts-expoect-error
    global.navigator = undefined;
    process.env.LANG = "de_DE.UTF-8";
    expect(detectUserLocale()).toBe("de-DE");
  });

  it("returns en-US if navigator properties are missing", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: undefined, languages: undefined },
      writable: true,
      configurable: true,
    });
    expect(detectUserLocale()).toBe("en-US");
  });

  it("returns en-US if process.env.LANG is missing", () => {
    // @ts-expoect-error
    global.navigator = undefined;
    delete process.env.LANG;
    expect(detectUserLocale()).toBe("en-US");
  });

  it("returns en-US as fallback", () => {
    // @ts-expoect-error
    global.navigator = undefined;
    // @ts-expoect-error
    global.process = undefined;
    expect(detectUserLocale()).toBe("en-US");
  });
});

describe("formatCoins", () => {
  it("returns empty string for empty input", () => {
    expect(formatCoins("")).toBe("");
  });

  it("formats USDC correctly", () => {
    expect(formatCoins(`1000000${USDC_DENOM}`)).toBe("1 USDC");
  });

  it("formats known denoms (xion) correctly", () => {
    expect(formatCoins("1000000uxion")).toBe("1 XION");
  });

  it("formats unknown denoms correctly", () => {
    expect(formatCoins("100uunknown")).toBe("100 UUNKNOWN");
    expect(formatCoins("100unknown")).toBe("100 UNKNOWN");
  });

  it("formats multiple coins", () => {
    expect(formatCoins("1000000uxion,100uunknown")).toBe(
      "1 XION, 100 UUNKNOWN",
    );
  });

  it("handles invalid coin strings gracefully", () => {
    expect(formatCoins("invalid")).toBe("");
  });

  it("formats known denom without 'u' prefix (falls back to default formatting)", () => {
    // 'xion' is in DENOM_DECIMALS but doesn't start with 'u', so it skips the special handling
    // and goes to default formatting which uppercases the denom.
    expect(formatCoins("1000000xion")).toBe("1000000 XION");
  });

  it("falls back to uppercase denom if display map entry is missing", () => {
    // Temporarily add a denom to DENOM_DECIMALS that isn't in DENOM_DISPLAY_MAP
    // to test the fallback logic

    // We need to bypass the readonly nature for testing
    Object.defineProperty(DENOM_DECIMALS, "missing", {
      value: 6,
      writable: true,
      configurable: true,
      enumerable: true,
    });

    expect(formatCoins("1000000umissing")).toBe("1 MISSING");

    // Cleanup (though it might not matter for other tests if they don't use 'missing')
    delete (DENOM_DECIMALS as any).missing;
  });
});
