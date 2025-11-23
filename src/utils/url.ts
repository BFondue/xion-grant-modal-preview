import { sanitizeUrl } from "@braintree/sanitize-url";

export function getDomainAndProtocol(url: string | undefined): string {
  try {
    const u = new URL(url || "");
    return u.protocol + "//" + u.hostname;
  } catch {
    return (url || "").trim();
  }
}

/**
 * Validates if a URL is safe by checking for potentially malicious patterns
 * @param url - The URL to validate
 * @returns true if the URL is safe, false otherwise
 */
export function isUrlSafe(url: string | undefined): boolean {
  if (!url) return false;

  try {
    // Sanitize the URL using @braintree/sanitize-url
    const sanitizedUrl = sanitizeUrl(url);

    // Normalize the original URL to handle trailing slashes
    const normalizedUrl = new URL(url).href;
    const normalizedSanitized = new URL(sanitizedUrl).href;

    // Check if the normalized URLs are different
    // This indicates that potentially malicious content was removed
    if (normalizedSanitized !== normalizedUrl) {
      return false;
    }

    const urlObj = new URL(url);

    // Block known dangerous protocols, but allow custom app protocols
    const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
    if (
      dangerousProtocols.some((protocol) =>
        urlObj.protocol.toLowerCase().startsWith(protocol),
      )
    ) {
      return false;
    }

    // Check for URL spoofing using @ character
    // This detects URLs like https://example.com@evil.com where the real domain is evil.com
    if (
      urlObj.pathname.includes("@") ||
      urlObj.hostname.includes("@") ||
      url.includes("@")
    ) {
      return false;
    }

    // Check for suspicious patterns in the decoded URL
    const decodedUrl = decodeURIComponent(url);

    // Common XSS patterns to check for
    const suspiciousPatterns = [
      "<script",
      "javascript:",
      "data:",
      "vbscript:",
      "onerror=",
      "onload=",
      "onclick=",
      "onmouseover=",
      "onfocus=",
      "onblur=",
      "eval(",
      "document.cookie",
      "<iframe",
      "<img",
      "alert(",
      "prompt(",
      "confirm(",
    ];

    // Check if any suspicious pattern is found in the decoded URL
    for (const pattern of suspiciousPatterns) {
      if (decodedUrl.toLowerCase().includes(pattern.toLowerCase())) {
        return false;
      }
    }

    return true;
  } catch {
    // If the URL is invalid, it's not safe
    return false;
  }
}

export function urlsMatch(
  urlA: string | undefined,
  urlB: string | undefined,
): boolean {
  return getDomainAndProtocol(urlA) === getDomainAndProtocol(urlB);
}
