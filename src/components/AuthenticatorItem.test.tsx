import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthenticatorItem } from "./AuthenticatorItem";
import { Authenticator } from "../indexer-strategies/types";

// Mock the UI components and utils
vi.mock("./ui", () => ({
  EyeIcon: () => <span>EyeIcon</span>,
  EyeOffIcon: () => <span>EyeOffIcon</span>,
  TrashIcon: ({ className }: { className?: string }) => (
    <span className={className}>TrashIcon</span>
  ),
}));

// Mock tooltip components to simplify testing
vi.mock("./ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  TooltipContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip-content">{children}</div>
  ),
  TooltipProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Mock authenticator helpers
vi.mock("../auth/utils/authenticator-helpers", () => ({
  capitalizeFirstLetter: (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1),
  getAuthenticatorLabel: (type: string) => type,
  getAuthenticatorLogo: () => <span>Logo</span>,
  extractUserIdFromAuthenticator: () => "user123",
  isEmailAuthenticator: (type: string) => type === "Jwt",
  getUserEmail: () => "test@example.com",
}));

describe("AuthenticatorItem", () => {
  const mockOnRemove = vi.fn();

  const createMockAuthenticator = (
    id: string,
    type: string,
    index: number,
  ): Authenticator => ({
    id,
    type,
    authenticator: "auth_" + id,
    authenticatorIndex: index,
  });

  const defaultProps = {
    authenticator: createMockAuthenticator("1", "Jwt", 0),
    currentAuthenticatorIndex: 1,
    isMainnet: false,
    onRemove: mockOnRemove,
    user: null,
    authType: "email",
    authenticators: [],
  };

  beforeEach(() => {
    mockOnRemove.mockClear();
  });

  describe("Passkey Protection Logic", () => {
    it("should prevent removing last non-passkey authenticator when authenticated with passkey", () => {
      const authenticators = [
        createMockAuthenticator("1", "Passkey", 0), // Current auth
        createMockAuthenticator("2", "Jwt", 1), // Last non-passkey
      ];

      render(
        <AuthenticatorItem
          {...defaultProps}
          authenticator={authenticators[1]} // Trying to remove the JWT auth
          currentAuthenticatorIndex={0} // Authenticated with passkey
          authenticators={authenticators}
        />,
      );

      const removeButton = screen.getByRole("button", {
        name: "Remove authenticator",
      });

      expect(removeButton).toBeDisabled();
      expect(removeButton).toHaveClass("ui-opacity-50 ui-cursor-not-allowed");

      // Check for tooltip content
      const tooltipContent = screen.getByTestId("tooltip-content");
      expect(tooltipContent).toHaveTextContent(
        "Cannot remove: Need at least one non-passkey authenticator",
      );
    });

    it("should allow removing non-passkey authenticator when authenticated with passkey if multiple non-passkeys exist", () => {
      const authenticators = [
        createMockAuthenticator("1", "Passkey", 0), // Current auth
        createMockAuthenticator("2", "Jwt", 1),
        createMockAuthenticator("3", "Jwt", 2), // Another non-passkey
      ];

      render(
        <AuthenticatorItem
          {...defaultProps}
          authenticator={authenticators[1]} // Trying to remove one JWT auth
          currentAuthenticatorIndex={0} // Authenticated with passkey
          authenticators={authenticators}
        />,
      );

      const removeButton = screen.getByRole("button", {
        name: "Remove authenticator",
      });

      expect(removeButton).not.toBeDisabled();
      expect(removeButton).not.toHaveClass(
        "ui-opacity-50 ui-cursor-not-allowed",
      );

      // Check for regular remove tooltip
      const tooltipContent = screen.getByTestId("tooltip-content");
      expect(tooltipContent).toHaveTextContent("Remove authenticator");

      fireEvent.click(removeButton);
      expect(mockOnRemove).toHaveBeenCalledWith(authenticators[1], "email");
    });

    it("should allow removing passkey when authenticated with non-passkey", () => {
      const authenticators = [
        createMockAuthenticator("1", "Jwt", 0), // Current auth
        createMockAuthenticator("2", "Passkey", 1), // Passkey to remove
      ];

      render(
        <AuthenticatorItem
          {...defaultProps}
          authenticator={authenticators[1]} // Trying to remove passkey
          currentAuthenticatorIndex={0} // Authenticated with JWT
          authenticators={authenticators}
        />,
      );

      const removeButton = screen.getByRole("button", {
        name: "Remove authenticator",
      });

      expect(removeButton).not.toBeDisabled();
      fireEvent.click(removeButton);
      expect(mockOnRemove).toHaveBeenCalledWith(authenticators[1], "email");
    });

    it("should prevent removing current authenticator regardless of type", () => {
      const authenticators = [
        createMockAuthenticator("1", "Jwt", 0),
        createMockAuthenticator("2", "Passkey", 1),
      ];

      render(
        <AuthenticatorItem
          {...defaultProps}
          authenticator={authenticators[0]} // Current authenticator
          currentAuthenticatorIndex={0} // Same as authenticator index
          authenticators={authenticators}
        />,
      );

      // Should not show remove button at all for current authenticator
      expect(
        screen.queryByRole("button", { name: "Remove authenticator" }),
      ).not.toBeInTheDocument();
    });

    it("should allow removing passkey when another passkey exists", () => {
      const authenticators = [
        createMockAuthenticator("1", "Passkey", 0), // Current auth
        createMockAuthenticator("2", "Passkey", 1), // Another passkey
        createMockAuthenticator("3", "Jwt", 2), // Non-passkey
      ];

      render(
        <AuthenticatorItem
          {...defaultProps}
          authenticator={authenticators[1]} // Trying to remove second passkey
          currentAuthenticatorIndex={0} // Authenticated with first passkey
          authenticators={authenticators}
        />,
      );

      const removeButton = screen.getByRole("button", {
        name: "Remove authenticator",
      });

      expect(removeButton).not.toBeDisabled();
      fireEvent.click(removeButton);
      expect(mockOnRemove).toHaveBeenCalledWith(authenticators[1], "email");
    });
  });

  describe("General Functionality", () => {
    it("should show active session badge for current authenticator", () => {
      render(
        <AuthenticatorItem
          {...defaultProps}
          authenticator={createMockAuthenticator("1", "Jwt", 0)}
          currentAuthenticatorIndex={0}
          authenticators={[createMockAuthenticator("1", "Jwt", 0)]}
        />,
      );

      expect(screen.getByText("Active Session")).toBeInTheDocument();
    });

    it("should toggle email visibility for email authenticators", () => {
      render(
        <AuthenticatorItem
          {...defaultProps}
          authenticator={createMockAuthenticator("1", "Jwt", 0)}
          currentAuthenticatorIndex={0}
          authenticators={[createMockAuthenticator("1", "Jwt", 0)]}
        />,
      );

      const toggleButton = screen.getByRole("button", { name: "Show email" });
      fireEvent.click(toggleButton);

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Hide email" }),
      ).toBeInTheDocument();
    });
  });
});
