import { describe, expect, test } from "vitest";
import { formatXionAmount } from "../utils/query-treasury-contract";

describe("formatXionAmount", () => {
  test("should format uxion amount correctly", () => {
    expect(formatXionAmount("1000000", "uxion")).toBe("1 XION");
    expect(formatXionAmount("500000", "uxion")).toBe("0.5 XION");
    expect(formatXionAmount("1", "uxion")).toBe("0.000001 XION");
    expect(formatXionAmount("1234567", "uxion")).toBe("1.234567 XION");
    expect(formatXionAmount("100", "uxion")).toBe("0.0001 XION");
    expect(formatXionAmount("10000", "uxion")).toBe("0.01 XION");
    expect(formatXionAmount("1000000000", "uxion")).toBe("1000 XION");
    expect(formatXionAmount("1000001", "uxion")).toBe("1.000001 XION");
  });

  test("should handle trailing zeros correctly", () => {
    expect(formatXionAmount("1000000000000", "uxion")).toBe("1000000 XION");
    expect(formatXionAmount("1000000100000", "uxion")).toBe("1000000.1 XION");
    expect(formatXionAmount("1000000010000", "uxion")).toBe("1000000.01 XION");
    expect(formatXionAmount("1000000001000", "uxion")).toBe("1000000.001 XION");
  });

  test("should keep original format for non-uxion denominations", () => {
    expect(formatXionAmount("1000", "other")).toBe("1000 other");
    expect(formatXionAmount("500", "token")).toBe("500 token");
  });

  test("should handle edge cases correctly", () => {
    // Very large numbers
    expect(formatXionAmount("1000000000000", "uxion")).toBe("1000000 XION");
    expect(formatXionAmount("999999999999", "uxion")).toBe(
      "999999.999999 XION",
    );

    // Zero values
    expect(formatXionAmount("0", "uxion")).toBe("0 XION");

    // Invalid inputs should return original format
    expect(formatXionAmount("invalid", "uxion")).toBe("invalid uxion");
    expect(formatXionAmount("-1000000", "uxion")).toBe("-1000000 uxion");
  });
});
