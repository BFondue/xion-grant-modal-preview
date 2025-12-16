import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthState } from "../useAuthState";
import { AuthStateManager } from "../AuthStateManager";

// Mock AuthStateManager
vi.mock("../AuthStateManager", () => {
  const mockState = {
    status: "disconnected" as const,
    connectionType: "none" as const,
    account: undefined,
    authenticator: null,
    error: null,
  };

  let listeners: Set<() => void> = new Set();

  return {
    AuthStateManager: {
      subscribe: vi.fn((listener: () => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      }),
      getState: vi.fn(() => mockState),
      startLogin: vi.fn(),
      completeLogin: vi.fn(),
      logout: vi.fn().mockResolvedValue(undefined),
      setOkxData: vi.fn(),
      getOkxData: vi.fn(() => ({ address: null, name: null })),
      setError: vi.fn(),
      clearError: vi.fn(),
      updateAccount: vi.fn(),
      resetState: vi.fn(),
      // Helper to update mock state for tests
      _setMockState: (newState: typeof mockState) => {
        Object.assign(mockState, newState);
        listeners.forEach((l) => l());
      },
      _resetMockState: () => {
        Object.assign(mockState, {
          status: "disconnected",
          connectionType: "none",
          account: undefined,
          authenticator: null,
          error: null,
        });
        listeners.clear();
      },
    },
  };
});

describe("useAuthState", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock state
    (AuthStateManager as any)._resetMockState();
  });

  describe("state properties", () => {
    it("should return current auth state", () => {
      const { result } = renderHook(() => useAuthState());

      expect(result.current.status).toBe("disconnected");
      expect(result.current.connectionType).toBe("none");
      expect(result.current.account).toBeUndefined();
      expect(result.current.authenticator).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it("should return computed isConnected as false when disconnected", () => {
      const { result } = renderHook(() => useAuthState());

      expect(result.current.isConnected).toBe(false);
    });

    it("should return computed isConnected as true when connected with account", () => {
      (AuthStateManager as any)._setMockState({
        status: "connected",
        connectionType: "stytch",
        account: { id: "xion1test", currentAuthenticatorIndex: 0, authenticators: [] },
        authenticator: "test-auth",
        error: null,
      });

      const { result } = renderHook(() => useAuthState());

      expect(result.current.isConnected).toBe(true);
    });

    it("should return isConnecting when in connecting state", () => {
      (AuthStateManager as any)._setMockState({
        status: "connecting",
        connectionType: "stytch",
        account: undefined,
        authenticator: "test-auth",
        error: null,
      });

      const { result } = renderHook(() => useAuthState());

      expect(result.current.isConnecting).toBe(true);
      expect(result.current.isConnected).toBe(false);
    });

    it("should return isDisconnecting when in disconnecting state", () => {
      (AuthStateManager as any)._setMockState({
        status: "disconnecting",
        connectionType: "stytch",
        account: undefined,
        authenticator: null,
        error: null,
      });

      const { result } = renderHook(() => useAuthState());

      expect(result.current.isDisconnecting).toBe(true);
    });

    it("should return isDisconnected when disconnected", () => {
      const { result } = renderHook(() => useAuthState());

      expect(result.current.isDisconnected).toBe(true);
    });

    it("should return address from account", () => {
      (AuthStateManager as any)._setMockState({
        status: "connected",
        connectionType: "stytch",
        account: { id: "xion1myaddress", currentAuthenticatorIndex: 0, authenticators: [] },
        authenticator: "test-auth",
        error: null,
      });

      const { result } = renderHook(() => useAuthState());

      expect(result.current.address).toBe("xion1myaddress");
    });

    it("should return null address when no account", () => {
      const { result } = renderHook(() => useAuthState());

      expect(result.current.address).toBeNull();
    });
  });

  describe("action methods", () => {
    it("should call AuthStateManager.startLogin", () => {
      const { result } = renderHook(() => useAuthState());

      act(() => {
        result.current.startLogin("stytch", "test-authenticator");
      });

      expect(AuthStateManager.startLogin).toHaveBeenCalledWith(
        "stytch",
        "test-authenticator"
      );
    });

    it("should call AuthStateManager.completeLogin", () => {
      const { result } = renderHook(() => useAuthState());
      const account = {
        id: "xion1test",
        currentAuthenticatorIndex: 0,
        authenticators: [],
      };

      act(() => {
        result.current.completeLogin(account);
      });

      expect(AuthStateManager.completeLogin).toHaveBeenCalledWith(account);
    });

    it("should call AuthStateManager.logout", async () => {
      const { result } = renderHook(() => useAuthState());
      const mockStytchClient = { session: { revoke: vi.fn() } };

      await act(async () => {
        await result.current.logout("https://example.com", mockStytchClient);
      });

      expect(AuthStateManager.logout).toHaveBeenCalledWith(
        "https://example.com",
        mockStytchClient
      );
    });

    it("should call AuthStateManager.setOkxData", () => {
      const { result } = renderHook(() => useAuthState());

      act(() => {
        result.current.setOkxData("xion1okx", "OKX Wallet");
      });

      expect(AuthStateManager.setOkxData).toHaveBeenCalledWith(
        "xion1okx",
        "OKX Wallet"
      );
    });

    it("should call AuthStateManager.getOkxData", () => {
      (AuthStateManager.getOkxData as ReturnType<typeof vi.fn>).mockReturnValue({
        address: "xion1okxaddr",
        name: "My OKX",
      });

      const { result } = renderHook(() => useAuthState());

      const okxData = result.current.getOkxData();

      expect(AuthStateManager.getOkxData).toHaveBeenCalled();
      expect(okxData).toEqual({ address: "xion1okxaddr", name: "My OKX" });
    });

    it("should call AuthStateManager.setError", () => {
      const { result } = renderHook(() => useAuthState());

      act(() => {
        result.current.setError("Something went wrong");
      });

      expect(AuthStateManager.setError).toHaveBeenCalledWith(
        "Something went wrong"
      );
    });

    it("should call AuthStateManager.clearError", () => {
      const { result } = renderHook(() => useAuthState());

      act(() => {
        result.current.clearError();
      });

      expect(AuthStateManager.clearError).toHaveBeenCalled();
    });

    it("should call AuthStateManager.updateAccount", () => {
      const { result } = renderHook(() => useAuthState());
      const newAccount = {
        id: "xion1updated",
        currentAuthenticatorIndex: 2,
        authenticators: [],
      };

      act(() => {
        result.current.updateAccount(newAccount);
      });

      expect(AuthStateManager.updateAccount).toHaveBeenCalledWith(newAccount);
    });

    it("should call AuthStateManager.resetState", () => {
      const { result } = renderHook(() => useAuthState());

      act(() => {
        result.current.resetState();
      });

      expect(AuthStateManager.resetState).toHaveBeenCalled();
    });
  });

  describe("subscription", () => {
    it("should subscribe to AuthStateManager on mount", () => {
      renderHook(() => useAuthState());

      expect(AuthStateManager.subscribe).toHaveBeenCalled();
    });

    it("should unsubscribe on unmount", () => {
      const unsubscribe = vi.fn();
      (AuthStateManager.subscribe as ReturnType<typeof vi.fn>).mockReturnValue(
        unsubscribe
      );

      const { unmount } = renderHook(() => useAuthState());
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it("should re-render when state changes", () => {
      const { result, rerender } = renderHook(() => useAuthState());

      expect(result.current.status).toBe("disconnected");

      // Simulate state change
      act(() => {
        (AuthStateManager as any)._setMockState({
          status: "connecting",
          connectionType: "stytch",
          account: undefined,
          authenticator: "new-auth",
          error: null,
        });
      });

      rerender();

      expect(result.current.status).toBe("connecting");
    });
  });

  describe("memoization", () => {
    it("should return stable function references", () => {
      const { result, rerender } = renderHook(() => useAuthState());

      const firstRender = {
        startLogin: result.current.startLogin,
        completeLogin: result.current.completeLogin,
        logout: result.current.logout,
        setOkxData: result.current.setOkxData,
        getOkxData: result.current.getOkxData,
        setError: result.current.setError,
        clearError: result.current.clearError,
        updateAccount: result.current.updateAccount,
        resetState: result.current.resetState,
      };

      rerender();

      expect(result.current.startLogin).toBe(firstRender.startLogin);
      expect(result.current.completeLogin).toBe(firstRender.completeLogin);
      expect(result.current.logout).toBe(firstRender.logout);
      expect(result.current.setOkxData).toBe(firstRender.setOkxData);
      expect(result.current.getOkxData).toBe(firstRender.getOkxData);
      expect(result.current.setError).toBe(firstRender.setError);
      expect(result.current.clearError).toBe(firstRender.clearError);
      expect(result.current.updateAccount).toBe(firstRender.updateAccount);
      expect(result.current.resetState).toBe(firstRender.resetState);
    });
  });
});
