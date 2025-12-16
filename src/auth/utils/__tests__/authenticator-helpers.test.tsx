import { describe, expect, it } from "vitest";
import {
  findLowestMissingOrNextIndex,
  capitalizeFirstLetter,
  getAuthenticatorLabel,
  getAuthenticatorLogo,
  extractUserIdFromAuthenticator,
  isEmailAuthenticator,
  getUserEmail,
} from "../authenticator-helpers";
import type { Authenticator } from "../../../indexer-strategies/types";

describe("authenticator-helpers", () => {
  describe("findLowestMissingOrNextIndex", () => {
    it("should throw error if authenticators is undefined", () => {
      expect(() => findLowestMissingOrNextIndex(undefined)).toThrow(
        "Missing authenticators"
      );
    });

    it("should return 0 for empty array", () => {
      expect(findLowestMissingOrNextIndex([])).toBe(0);
    });

    it("should return 0 if index 0 is missing", () => {
      const authenticators: Authenticator[] = [
        { authenticator: "auth1", authenticatorIndex: 1, type: "JWT" },
        { authenticator: "auth2", authenticatorIndex: 2, type: "JWT" },
      ];
      expect(findLowestMissingOrNextIndex(authenticators)).toBe(0);
    });

    it("should return next index if all indices are sequential", () => {
      const authenticators: Authenticator[] = [
        { authenticator: "auth0", authenticatorIndex: 0, type: "JWT" },
        { authenticator: "auth1", authenticatorIndex: 1, type: "JWT" },
        { authenticator: "auth2", authenticatorIndex: 2, type: "JWT" },
      ];
      expect(findLowestMissingOrNextIndex(authenticators)).toBe(3);
    });

    it("should return lowest missing index in a gap", () => {
      const authenticators: Authenticator[] = [
        { authenticator: "auth0", authenticatorIndex: 0, type: "JWT" },
        { authenticator: "auth2", authenticatorIndex: 2, type: "JWT" },
        { authenticator: "auth3", authenticatorIndex: 3, type: "JWT" },
      ];
      expect(findLowestMissingOrNextIndex(authenticators)).toBe(1);
    });

    it("should handle single authenticator", () => {
      const authenticators: Authenticator[] = [
        { authenticator: "auth0", authenticatorIndex: 0, type: "JWT" },
      ];
      expect(findLowestMissingOrNextIndex(authenticators)).toBe(1);
    });

    it("should handle non-sequential starting index", () => {
      const authenticators: Authenticator[] = [
        { authenticator: "auth5", authenticatorIndex: 5, type: "JWT" },
      ];
      expect(findLowestMissingOrNextIndex(authenticators)).toBe(0);
    });
  });

  describe("capitalizeFirstLetter", () => {
    it("should capitalize first letter of a string", () => {
      expect(capitalizeFirstLetter("hello")).toBe("Hello");
    });

    it("should return empty string for undefined", () => {
      expect(capitalizeFirstLetter(undefined)).toBe("");
    });

    it("should return empty string for empty string", () => {
      expect(capitalizeFirstLetter("")).toBe("");
    });

    it("should handle single character", () => {
      expect(capitalizeFirstLetter("a")).toBe("A");
    });

    it("should not change already capitalized string", () => {
      expect(capitalizeFirstLetter("Hello")).toBe("Hello");
    });

    it("should handle strings starting with numbers", () => {
      expect(capitalizeFirstLetter("123abc")).toBe("123abc");
    });
  });

  describe("getAuthenticatorLabel", () => {
    it("should return 'Cosmos Wallet' for SECP256K1", () => {
      expect(getAuthenticatorLabel("SECP256K1")).toBe("Cosmos Wallet");
    });

    it("should return 'EVM Wallet' for ETHWALLET", () => {
      expect(getAuthenticatorLabel("ETHWALLET")).toBe("EVM Wallet");
    });

    it("should return 'Email' for JWT", () => {
      expect(getAuthenticatorLabel("JWT")).toBe("Email");
    });

    it("should return 'Passkey' for PASSKEY", () => {
      expect(getAuthenticatorLabel("PASSKEY")).toBe("Passkey");
    });

    it("should return empty string for unknown type", () => {
      // @ts-expect-error - Testing unknown type
      expect(getAuthenticatorLabel("UNKNOWN")).toBe("");
    });
  });

  describe("getAuthenticatorLogo", () => {
    it("should return CosmosLogo for SECP256K1", () => {
      const logo = getAuthenticatorLogo("SECP256K1");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("CosmosLogo");
    });

    it("should return EthereumLogo for ETHWALLET", () => {
      const logo = getAuthenticatorLogo("ETHWALLET");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("EthereumLogo");
    });

    it("should return PasskeyIcon for PASSKEY", () => {
      const logo = getAuthenticatorLogo("PASSKEY");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("PasskeyIcon");
    });

    it("should return EmailIcon for JWT without subtype", () => {
      const logo = getAuthenticatorLogo("JWT");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("EmailIcon");
    });

    it("should return EmailIcon for JWT with email subtype", () => {
      const logo = getAuthenticatorLogo("JWT", "email");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("EmailIcon");
    });

    it("should return GoogleLogoIcon for JWT with google subtype", () => {
      const logo = getAuthenticatorLogo("JWT", "google");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("GoogleLogoIcon");
    });

    it("should return AppleLogoIcon for JWT with apple subtype", () => {
      const logo = getAuthenticatorLogo("JWT", "apple");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("AppleLogoIcon");
    });

    it("should return GithubLogoIcon for JWT with github subtype", () => {
      const logo = getAuthenticatorLogo("JWT", "github");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("GithubLogoIcon");
    });

    it("should return XLogoIcon for JWT with twitter subtype", () => {
      const logo = getAuthenticatorLogo("JWT", "twitter");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("XLogoIcon");
    });

    it("should return EmailIcon for JWT with unknown subtype", () => {
      const logo = getAuthenticatorLogo("JWT", "unknown_provider");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("EmailIcon");
    });

    it("should return AccountWalletLogo for unknown type", () => {
      // @ts-expect-error - Testing unknown type
      const logo = getAuthenticatorLogo("UNKNOWN");
      expect(logo).toBeDefined();
      expect(logo.type.name).toBe("AccountWalletLogo");
    });
  });

  describe("extractUserIdFromAuthenticator", () => {
    it("should extract userId from JWT authenticator", () => {
      expect(
        extractUserIdFromAuthenticator("identifier.user123", "JWT")
      ).toBe("user123");
    });

    it("should extract userId from Jwt authenticator (case variation)", () => {
      expect(
        extractUserIdFromAuthenticator("identifier.user456", "Jwt")
      ).toBe("user456");
    });

    it("should return null for non-JWT type", () => {
      expect(
        extractUserIdFromAuthenticator("some.authenticator", "SECP256K1")
      ).toBeNull();
    });

    it("should return null if authenticator has no dot separator", () => {
      expect(
        extractUserIdFromAuthenticator("nodotauthenticator", "JWT")
      ).toBeNull();
    });

    it("should return null for ETHWALLET type", () => {
      expect(
        extractUserIdFromAuthenticator("identifier.userid", "ETHWALLET")
      ).toBeNull();
    });

    it("should return null for PASSKEY type", () => {
      expect(
        extractUserIdFromAuthenticator("identifier.userid", "PASSKEY")
      ).toBeNull();
    });

    it("should handle authenticator with multiple dots", () => {
      expect(
        extractUserIdFromAuthenticator("part1.part2.part3", "JWT")
      ).toBe("part2");
    });
  });

  describe("isEmailAuthenticator", () => {
    it("should return true for Jwt type with email subtype", () => {
      expect(isEmailAuthenticator("Jwt", "email")).toBe(true);
    });

    it("should return true for Jwt type with Email subtype (case insensitive)", () => {
      expect(isEmailAuthenticator("Jwt", "Email")).toBe(true);
    });

    it("should return true for Jwt type with EMAIL subtype (uppercase)", () => {
      expect(isEmailAuthenticator("Jwt", "EMAIL")).toBe(true);
    });

    it("should return false for Jwt type with google subtype", () => {
      expect(isEmailAuthenticator("Jwt", "google")).toBe(false);
    });

    it("should return false for non-Jwt type", () => {
      expect(isEmailAuthenticator("SECP256K1", "email")).toBe(false);
    });

    it("should return false for Jwt type without subtype", () => {
      expect(isEmailAuthenticator("Jwt")).toBe(false);
    });

    it("should return false for Jwt type with undefined subtype", () => {
      expect(isEmailAuthenticator("Jwt", undefined)).toBe(false);
    });
  });

  describe("getUserEmail", () => {
    it("should return email when user and userId match", () => {
      const user = {
        user_id: "user123",
        emails: [{ email: "test@example.com" }],
      };
      expect(getUserEmail(user, "user123")).toBe("test@example.com");
    });

    it("should return empty string when user is null", () => {
      expect(getUserEmail(null, "user123")).toBe("");
    });

    it("should return empty string when userId is null", () => {
      const user = {
        user_id: "user123",
        emails: [{ email: "test@example.com" }],
      };
      expect(getUserEmail(user, null)).toBe("");
    });

    it("should return empty string when user_id does not match userId", () => {
      const user = {
        user_id: "user123",
        emails: [{ email: "test@example.com" }],
      };
      expect(getUserEmail(user, "different_user")).toBe("");
    });

    it("should return empty string when user has no emails", () => {
      const user = {
        user_id: "user123",
        emails: [],
      };
      expect(getUserEmail(user, "user123")).toBe("");
    });

    it("should return first email when user has multiple emails", () => {
      const user = {
        user_id: "user123",
        emails: [
          { email: "first@example.com" },
          { email: "second@example.com" },
        ],
      };
      expect(getUserEmail(user, "user123")).toBe("first@example.com");
    });

    it("should return empty string when emails is undefined", () => {
      const user = {
        user_id: "user123",
        emails: undefined as any,
      };
      expect(getUserEmail(user, "user123")).toBe("");
    });
  });
});
