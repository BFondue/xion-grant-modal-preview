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

    // Check if the sanitized URL is different from the original URL
    // This indicates that potentially malicious content was removed
    if (sanitizedUrl !== url) {
      return false;
    }

    const urlObj = new URL(url);

    // Only allow http: and https: protocols
    if (urlObj.protocol !== "http:" && urlObj.protocol !== "https:") {
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
