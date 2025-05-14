import { getDomainAndProtocol, isUrlSafe, urlsMatch } from "./url";

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

describe("isUrlSafe", () => {
  it("returns true for valid HTTP/HTTPS URLs", () => {
    expect(isUrlSafe("https://example.com/callback")).toBe(true);
    expect(isUrlSafe("http://localhost:3000/auth")).toBe(true);
    expect(isUrlSafe("https://xion.burnt.com/dashboard")).toBe(true);
    expect(isUrlSafe("https://app.xion.burnt.com/login?param=value")).toBe(
      true,
    );
    expect(isUrlSafe("https://subdomain.burnt.com/path")).toBe(true);
    expect(isUrlSafe("https://burnt-labs.github.io/app")).toBe(true);
  });

  it("returns false for dangerous protocols", () => {
    expect(isUrlSafe("javascript:alert(1)")).toBe(false);
    expect(isUrlSafe("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isUrlSafe("vbscript:msgbox('XSS')")).toBe(false);
    expect(isUrlSafe("file:///etc/passwd")).toBe(false);
  });

  it("returns true for native app URIs", () => {
    expect(isUrlSafe("myapp://open")).toBe(true);
    expect(isUrlSafe("app-name://auth/callback")).toBe(true);
    expect(isUrlSafe("xion://wallet/connect")).toBe(true);
    expect(isUrlSafe("ftp://example.com")).toBe(true);
  });

  it("returns false for URLs with suspicious encoded characters", () => {
    expect(
      isUrlSafe(
        "https://example.com/?redirect=%3Cscript%3Ealert(1)%3C/script%3E",
      ),
    ).toBe(false);
    expect(
      isUrlSafe(
        "https://example.com/?redirect=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
      ),
    ).toBe(false);
    expect(
      isUrlSafe(
        "https://example.com/?redirect=%3Ciframe%20src%3Djavascript:alert(1)%3E",
      ),
    ).toBe(false);
    expect(
      isUrlSafe(
        "https://example.com/?redirect=%22%20onmouseover%3Dalert(1)%20%22",
      ),
    ).toBe(false);
    expect(isUrlSafe("https://example.com/?redirect=eval(alert(1))")).toBe(
      false,
    );
  });

  it("returns false for the specific malicious URL from the issue description", () => {
    const maliciousUrl =
      "https://settings.burnt.com/?stake=true&grantee=xion1getyfqxdqqlfhhmmrg60ya020pcjpzqvcj9xqy&redirect_uri=javascript%3Avar%7Ba%3A%5Cu006f%5Cu006e%5Cu0065%5Cu0072%5Cu0072%5Cu006f%5Cu0072%7D%3D%7Ba%3A%5Cu0061%5Cu006C%5Cu0065%5Cu0072%5Cu0074%7D%3Bthrow%2520%5Cu0064%5Cu006f%5Cu0063%5Cu0075%5Cu006d%5Cu0065%5Cu006e%5Cu0074.%5Cu0063%5Cu006f%5Cu006f%5Cu006b%5Cu0069%5Cu0065";
    expect(isUrlSafe(maliciousUrl)).toBe(false);
  });

  it("returns false for invalid URLs", () => {
    expect(isUrlSafe("not-a-url")).toBe(false);
    expect(isUrlSafe("")).toBe(false);
    expect(isUrlSafe(undefined)).toBe(false);
  });
});
