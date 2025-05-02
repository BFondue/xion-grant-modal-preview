import { getDomainAndProtocol, urlsMatch } from "./url";

describe("getDomainAndProtocol", () => {
  it("returns protocol and host for a valid URL", () => {
    expect(getDomainAndProtocol("https://example.com/path")).toBe(
      "https://example.com",
    );
    expect(getDomainAndProtocol("http://localhost:3000/test")).toBe(
      "http://localhost",
    );
  });

  it("trims whitespace from the URL", () => {
    expect(getDomainAndProtocol("  https://example.com/test  ")).toBe(
      "https://example.com",
    );
  });

  it("returns the original string if the URL is invalid", () => {
    expect(getDomainAndProtocol("not a url")).toBe("not a url");
    expect(getDomainAndProtocol("")).toBe("");
    expect(getDomainAndProtocol(undefined)).toBe("");
  });
});

describe("urlsMatch", () => {
  it("returns true for URLs with the same protocol and host", () => {
    expect(urlsMatch("https://example.com", "https://example.com/")).toBe(true);
    expect(
      urlsMatch("https://example.com/path", "https://example.com/other"),
    ).toBe(true);
    expect(
      urlsMatch("http://localhost:3000", "http://localhost:3000/test"),
    ).toBe(true);
  });

  it("returns false for URLs with different protocols or hosts", () => {
    expect(urlsMatch("https://example.com", "http://example.com")).toBe(false);
    expect(urlsMatch("https://example.com", "https://other.com")).toBe(false);
    expect(urlsMatch("https://example.com", "not a url")).toBe(false);
  });

  it("handles undefined and empty strings", () => {
    expect(urlsMatch(undefined, undefined)).toBe(true);
    expect(urlsMatch("", "")).toBe(true);
    expect(urlsMatch(undefined, "")).toBe(true);
    expect(urlsMatch("https://example.com", undefined)).toBe(false);
  });
});
