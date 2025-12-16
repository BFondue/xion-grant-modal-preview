import { describe, expect, it, vi } from "vitest";
import {
  formatIBCAddresses,
  IBC_ADDRESS_PATTERN,
} from "../../utils/format-ibc-addresses";
import { Asset } from "@/types/assets";

describe("format-ibc-addresses", () => {
  describe("IBC_ADDRESS_PATTERN", () => {
    it("should match valid IBC addresses", () => {
      const validAddresses = [
        "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
        "ibc/FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF",
        "ibc/0000000000000000000000000000000000000000000000000000000000000000",
      ];

      validAddresses.forEach((address) => {
        expect(address).toMatch(IBC_ADDRESS_PATTERN);
      });
    });

    it("should not match invalid IBC addresses", () => {
      const invalidAddresses = [
        "ibc/123", // Too short
        "ibc/GHIJKLMNOP1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12345", // Contains invalid characters
        "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDE", // 63 characters
        "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF0", // 65 characters
        "not-ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
        "1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF", // Missing ibc/ prefix
      ];

      invalidAddresses.forEach((address) => {
        expect(address).not.toMatch(
          new RegExp(`^${IBC_ADDRESS_PATTERN.source}$`, "i"),
        );
      });
    });

    it("should be case-insensitive", () => {
      const addresses = [
        "ibc/abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "IBC/ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890",
        "Ibc/AbCdEf1234567890aBcDeF1234567890AbCdEf1234567890aBcDeF1234567890",
      ];

      addresses.forEach((address) => {
        expect(address).toMatch(IBC_ADDRESS_PATTERN);
      });
    });
  });

  describe("formatIBCAddresses", () => {
    const mockAsset: Asset = {
      symbol: "USDC",
      name: "USD Coin",
      base: "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
      display: "usdc",
      denom_units: [
        {
          denom:
            "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
          exponent: 0,
        },
        { denom: "usdc", exponent: 6 },
      ],
      type_asset: "ics20",
      coingecko_id: "usd-coin",
      images: [],
    };

    const getAssetByDenomMock = vi.fn();

    beforeEach(() => {
      getAssetByDenomMock.mockClear();
    });

    it("should replace IBC address with asset symbol when asset is found", () => {
      getAssetByDenomMock.mockReturnValue(mockAsset);

      const text =
        "Transfer 100 ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF to wallet";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe("Transfer 100 USDC to wallet");
      expect(getAssetByDenomMock).toHaveBeenCalledWith(
        "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
      );
    });

    it("should truncate IBC address when asset is not found", () => {
      getAssetByDenomMock.mockReturnValue(undefined);

      const text =
        "Transfer 100 ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF to wallet";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe("Transfer 100 ibc/1234...CDEF to wallet");
    });

    it("should handle multiple IBC addresses in the same text", () => {
      const asset1: Asset = { ...mockAsset, symbol: "USDC" };
      const asset2: Asset = {
        ...mockAsset,
        symbol: "ATOM",
        base: "ibc/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        display: "atom",
        denom_units: [
          {
            denom:
              "ibc/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            exponent: 0,
          },
          { denom: "atom", exponent: 6 },
        ],
      };

      getAssetByDenomMock
        .mockReturnValueOnce(asset1)
        .mockReturnValueOnce(asset2)
        .mockReturnValueOnce(undefined);

      const text =
        "Send ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF and ibc/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA and ibc/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe("Send USDC and ATOM and ibc/BBBB...BBBB");
    });

    it("should handle text with no IBC addresses", () => {
      const text = "This is a regular text without any IBC addresses";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe(text);
      expect(getAssetByDenomMock).not.toHaveBeenCalled();
    });

    it("should handle empty text", () => {
      const result = formatIBCAddresses("", getAssetByDenomMock);

      expect(result).toBe("");
      expect(getAssetByDenomMock).not.toHaveBeenCalled();
    });

    it("should handle case-insensitive IBC addresses", () => {
      getAssetByDenomMock.mockReturnValue(mockAsset);

      const text =
        "Transfer IBC/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF tokens";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe("Transfer USDC tokens");
    });

    it("should handle IBC addresses at the beginning and end of text", () => {
      getAssetByDenomMock.mockReturnValue(mockAsset);

      const textStart =
        "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF is the token";
      const resultStart = formatIBCAddresses(textStart, getAssetByDenomMock);
      expect(resultStart).toBe("USDC is the token");

      const textEnd =
        "The token is ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF";
      const resultEnd = formatIBCAddresses(textEnd, getAssetByDenomMock);
      expect(resultEnd).toBe("The token is USDC");
    });

    it("should handle consecutive IBC addresses", () => {
      getAssetByDenomMock
        .mockReturnValueOnce({ ...mockAsset, symbol: "USDC" })
        .mockReturnValueOnce({ ...mockAsset, symbol: "ATOM" });

      const text =
        "ibc/1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEFibc/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe("USDCATOM");
    });

    it("should preserve original formatting for non-matching patterns", () => {
      const text =
        "Transfer ibc/SHORT or ibc/toolong1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe(text);
      expect(getAssetByDenomMock).not.toHaveBeenCalled();
    });

    it("should handle mixed case in hash when truncating", () => {
      getAssetByDenomMock.mockReturnValue(undefined);

      // IBC address with exactly 64 hex characters after "ibc/"
      const text =
        "ibc/ABCdef1234567890ABCdef1234567890ABCdef1234567890ABCdef1234567890";
      const result = formatIBCAddresses(text, getAssetByDenomMock);

      expect(result).toBe("ibc/ABCd...7890");
    });
  });
});
