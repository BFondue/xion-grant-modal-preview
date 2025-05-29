import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalStorageMock,
  createStytchMock,
  fillOtpInputs,
  mockEnvironmentVariables,
  render,
  screen,
  waitFor,
} from "../../../test";
import { AbstraxionSignin } from "../index";
import { AbstraxionContext } from "../../AbstraxionContext";
import type { ChainInfo } from "@burnt-labs/constants";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const stytchMock = createStytchMock();
stytchMock.otps.email.loginOrCreate = vi
  .fn()
  .mockResolvedValue({ method_id: "test-method-id" });

vi.mock("@stytch/react", () => ({
  useStytch: () => stytchMock,
  useStytchSession: () => ({
    session: { session_id: "test-session-id" },
  }),
}));

vi.mock("@delphi-labs/shuttle-react", () => ({
  useShuttle: () => ({
    connect: vi.fn(),
  }),
}));

mockEnvironmentVariables({
  VITE_TIKTOK_FLAG: "true",
});

const setupTest = () => {
  const localStorageMock = createLocalStorageMock();
  localStorageMock.getItem.mockReturnValue(null);

  const mockSetConnectionType = vi.fn();

  return { localStorageMock, mockSetConnectionType };
};

// Test chain info
const testChainInfo: Partial<ChainInfo> = {
  chainId: "xion-testnet-1",
  chainName: "XION Testnet",
  rpc: "https://testnet-rpc.xion.burnt.com:443",
  rest: "https://testnet-api.xion.burnt.com:443",
};

// Setup before each test
beforeEach(() => {
  // Mock ResizeObserver and MutationObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // global.MutationObserver = class MutationObserver {
  //   constructor(callback: MutationCallback) {}
  //   observe() {}
  //   disconnect() {}
  // };
  Object.defineProperty(window, "location", {
    value: {
      origin: "https://test.com",
      search: "",
    },
    writable: true,
  });

  vi.clearAllMocks();
});

// Helper to get email input
const getEmailInput = () => {
  const emailLabel = screen.getByText("Email");
  const inputContainer = emailLabel.closest("div");
  return inputContainer?.querySelector("input") as HTMLInputElement;
};

// Render helper with context
const renderSignin = async () => {
  const { localStorageMock, mockSetConnectionType } = setupTest();

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const utils = await render(
    <QueryClientProvider client={queryClient}>
      <AbstraxionContext.Provider
        value={{
          connectionType: "none",
          setConnectionType: mockSetConnectionType,
          setAbstraxionError: vi.fn(),
          chainInfo: testChainInfo as ChainInfo,
          isMainnet: false,
          isOpen: true,
          isChainInfoLoading: false,
          setIsOpen: vi.fn(),
          isInGrantFlow: false,
          abstractAccount: undefined,
          setAbstractAccount: vi.fn(),
          abstraxionError: "",
          apiUrl: "https://test-api.com",
        }}
      >
        <AbstraxionSignin />
      </AbstraxionContext.Provider>
    </QueryClientProvider>,
  );

  return {
    ...utils,
    localStorageMock,
    mockSetConnectionType,
  };
};

describe("AbstraxionSignin Component", () => {
  it("renders the login form with all required elements", async () => {
    await renderSignin();

    // Check all essential elements are present
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /log in \/ sign up/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Google")).toBeInTheDocument();
  });

  it("validates email format and shows error message", async () => {
    const { user } = await renderSignin();

    // Type invalid email and check error
    await user.type(getEmailInput(), "invalid-email");
    await user.tab();

    expect(screen.getByText("Invalid Email Format")).toBeInTheDocument();
  });

  it("transitions to OTP screen after email submission", async () => {
    const { user, mockSetConnectionType } = await renderSignin();

    // Submit valid email
    await user.type(getEmailInput(), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: /log in \/ sign up/i }),
    );

    // Check transition to OTP screen
    await waitFor(() => {
      expect(screen.getByText("Input 6 Digit Code")).toBeInTheDocument();
    });

    expect(mockSetConnectionType).toHaveBeenCalledWith("stytch");
  });

  it("calls Google OAuth when clicking Google button", async () => {
    const { user } = await renderSignin();

    await user.click(screen.getByText("Google"));

    expect(stytchMock.oauth.google.start).toHaveBeenCalled();
  });

  it("handles OTP verification flow", async () => {
    const { user, localStorageMock } = await renderSignin();

    // Navigate to OTP screen
    await user.type(getEmailInput(), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: /log in \/ sign up/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Input 6 Digit Code")).toBeInTheDocument();
    });

    // Use the fillOtpInputs utility
    await fillOtpInputs(user, "123456");

    // Submit OTP
    await user.click(screen.getByRole("button", { name: /confirm/i }));

    expect(stytchMock.otps.authenticate).toHaveBeenCalledWith(
      "123456",
      "test-method-id",
      {
        session_duration_minutes: 60 * 24 * 3,
      },
    );

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "loginType",
      "stytch",
    );
  });

  it("shows error message when email login fails", async () => {
    const { user, mockSetConnectionType } = await renderSignin();

    // Mock the error
    stytchMock.otps.email.loginOrCreate.mockRejectedValueOnce(
      new Error("Failed to send email"),
    );

    // Attempt login
    await user.type(getEmailInput(), "test@example.com");
    await user.click(
      screen.getByRole("button", { name: /log in \/ sign up/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Error sending email")).toBeInTheDocument();
    });

    expect(mockSetConnectionType).toHaveBeenCalledWith("none");
  });
});
