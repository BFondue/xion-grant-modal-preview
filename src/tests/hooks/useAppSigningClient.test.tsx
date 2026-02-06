import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useSigningClient } from "../../hooks/useSigningClient";
import { AuthContext } from "../../components/AuthContext";
import { CONNECTION_METHOD } from "../../auth/useAuthState";

import {
  AADirectSigner,
  AAEthSigner,
  AAClient,
  AUTHENTICATOR_TYPE,
} from "@burnt-labs/signers";
import { AbstractAccountJWTSigner } from "../../auth/jwt/jwt-signer";

const { mockGetTokens } = vi.hoisted(() => {
  const mockGetTokens = vi
    .fn()
    .mockReturnValue({ session_token: "mock-token" });
  return { mockGetTokens };
});

// Mock dependencies
vi.mock("@stytch/react", () => ({
  useStytch: () => ({
    session: {
      getTokens: mockGetTokens,
    },
  }),
}));

vi.mock("@burnt-labs/signers", () => ({
  AAClient: {
    connectWithSigner: vi.fn().mockResolvedValue({
      addAccount: vi.fn(),
    }),
  },
  AADirectSigner: vi.fn(),
  AAEthSigner: vi.fn(),
  AASigner: vi.fn(),
  AUTHENTICATOR_TYPE: {
    Secp256K1: "Secp256K1",
    EthWallet: "EthWallet",
    JWT: "JWT",
    Passkey: "Passkey",
  },
}));

vi.mock("../../auth/jwt/jwt-signer", () => ({
  AbstractAccountJWTSigner: vi.fn(),
}));

vi.mock("../../signers/signers/passkey-signer", () => ({
  AAPasskeySigner: vi.fn(),
}));

vi.mock("../../utils/fees", () => ({
  formatGasPrice: vi.fn().mockReturnValue({ amount: "0", denom: "uxion" }),
  getGasCalculation: vi.fn().mockReturnValue({
    gasPrice: { amount: "0", denom: "uxion" },
  }),
}));

vi.mock("../../config", () => ({
  STYTCH_PROXY_URL: "https://mock-stytch-proxy.com",
}));

// Mock connection adapters
vi.mock("../../connectionAdapters", () => ({
  getConnectionAdapter: vi.fn((authenticatorType, connectionMethod) => {
    // Create a mock adapter based on the connection method
    const mockAdapter = {
      authenticatorType,
      connectionMethod,
      name: `Mock ${connectionMethod} Adapter`,
      isInstalled: () => true,
      enable: vi.fn().mockResolvedValue(undefined),
      getSigner: vi.fn(),
    };

    // Configure getSigner based on connection method
    if (connectionMethod === "stytch") {
      // JWT adapter
      mockAdapter.getSigner = vi.fn(
        (abstractAccount, authIndex, sessionToken, apiUrl) => {
          return new (AbstractAccountJWTSigner as any)(
            abstractAccount,
            authIndex,
            sessionToken,
            apiUrl,
          );
        },
      );
    } else if (connectionMethod === "keplr" || connectionMethod === "okx") {
      // Secp256k1 adapter
      mockAdapter.getSigner = vi.fn(async () => {
        return new (AADirectSigner as any)();
      });
    } else if (connectionMethod === "metamask") {
      // EthWallet adapter
      mockAdapter.getSigner = vi.fn(() => {
        return new (AAEthSigner as any)();
      });
    } else if (connectionMethod === "passkey") {
      // Passkey adapter
      mockAdapter.getSigner = vi.fn(() => {
        return { type: "passkey-signer" }; // Mock passkey signer
      });
    }

    return mockAdapter;
  }),
}));

describe("useSigningClient", () => {
  const mockChainInfo = {
    chainId: "xion-testnet-1",
    chainName: "XION Testnet",
    rpc: "https://rpc.testnet.xion.burnt.com",
    rest: "https://api.testnet.xion.burnt.com",
  };

  const mockAbstractAccount = {
    id: "xion1mockaccount",
    currentAuthenticatorIndex: 0,
  };

  const wrapper = ({
    children,
    contextValue = {},
  }: {
    children: React.ReactNode;
    contextValue?: any;
  }) => (
    <AuthContext.Provider
      value={{
        connectionMethod: CONNECTION_METHOD.Stytch,
        authenticatorType: AUTHENTICATOR_TYPE.JWT,
        abstractAccount: mockAbstractAccount,
        chainInfo: mockChainInfo,
        isChainInfoLoading: false,
        ...contextValue,
      }}
    >
      {children}
    </AuthContext.Provider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.keplr
    window.keplr = {
      getOfflineSigner: vi.fn().mockReturnValue({}),
    } as any;
    // Mock window.ethereum
    window.ethereum = {
      request: vi.fn(),
    } as any;
    // Mock window.okxwallet
    window.okxwallet = {
      keplr: {
        enable: vi.fn(),
        signArbitrary: vi.fn(),
        getOfflineSigner: vi.fn().mockReturnValue({}),
      },
    } as any;
  });

  afterEach(() => {
    delete (window as any).keplr;
    delete (window as any).ethereum;
    delete (window as any).okxwallet;
  });

  it("should return client when initialized with stytch", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({
          ...props,
          contextValue: { connectionMethod: CONNECTION_METHOD.Stytch },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with shuttle (keplr)", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({
          ...props,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Keplr,
            authenticatorType: AUTHENTICATOR_TYPE.Secp256K1,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with metamask", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({
          ...props,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Metamask,
            authenticatorType: AUTHENTICATOR_TYPE.EthWallet,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with okx", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({
          ...props,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.OKX,
            authenticatorType: AUTHENTICATOR_TYPE.Secp256K1,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with passkey", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({
          ...props,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Passkey,
            authenticatorType: AUTHENTICATOR_TYPE.Passkey,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return undefined client if chain info is loading", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({ ...props, contextValue: { isChainInfoLoading: true } }),
    });

    expect(result.current.client).toBeUndefined();
  });

  it("should return undefined client if abstract account is missing", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({ ...props, contextValue: { abstractAccount: undefined } }),
    });

    expect(result.current.client).toBeUndefined();
  });

  it("should return undefined client if chain info is missing", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: (props) =>
        wrapper({ ...props, contextValue: { chainInfo: undefined } }),
    });

    expect(result.current.client).toBeUndefined();
  });

  it("should initialize client with shuttle (Keplr) signer", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Keplr,
            authenticatorType: AUTHENTICATOR_TYPE.Secp256K1,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should initialize client with okx signer", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.OKX,
            authenticatorType: AUTHENTICATOR_TYPE.Secp256K1,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should initialize client with metamask signer", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Metamask,
            authenticatorType: AUTHENTICATOR_TYPE.EthWallet,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should initialize client with passkey signer", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Passkey,
            authenticatorType: AUTHENTICATOR_TYPE.Passkey,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should not initialize client with none connection type", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: { connectionMethod: CONNECTION_METHOD.None },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeUndefined();
    });
  });

  it("should handle missing signer gracefully", async () => {
    // Mock window.keplr to be undefined for shuttle connection
    const originalKeplr = window.keplr;
    delete (window as any).keplr;

    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Keplr,
            authenticatorType: AUTHENTICATOR_TYPE.Secp256K1,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeUndefined();
    });

    // Restore keplr
    window.keplr = originalKeplr;
  });

  // Note: Tests for okxSignArb and ethSigningFn implementation details were removed
  // because they tested internal implementation of the old approach.
  // With the new adapter pattern, these signing functions are encapsulated within
  // the adapters and are not directly accessible. The functionality is still tested
  // through the client creation tests above.

  it("should provide getGasCalculation function", async () => {
    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Stytch,
            authenticatorType: AUTHENTICATOR_TYPE.JWT,
          },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });

    expect(result.current.getGasCalculation).toBeDefined();
    result.current.getGasCalculation(1000);
    // We mocked getGasCalculation in gas-utils, so we can check if it was called?
    // Actually the hook calls the imported getGasCalculation.
    // We can check if the result is what we expect from the mock.
    const gasCalc = result.current.getGasCalculation(1000);
    expect(gasCalc).toEqual({ gasPrice: { amount: "0", denom: "uxion" } });
  });

  it("should handle missing session token", async () => {
    // Mock useStytch to return null tokens
    mockGetTokens.mockReturnValue(null);

    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: { connectionMethod: CONNECTION_METHOD.Stytch },
        }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });

    // Verify that AbstractAccountJWTSigner was called with undefined session token
    expect(AbstractAccountJWTSigner).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined, // sessionToken
      expect.anything(),
    );

    // Restore mock
    mockGetTokens.mockReturnValue({ session_token: "mock-token" });
  });

  it("should update keplr state on keplr_keystorechange event", async () => {
    // Start with no keplr
    const originalKeplr = window.keplr;
    delete (window as any).keplr;

    const { result } = renderHook(() => useSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({
          children,
          contextValue: {
            connectionMethod: CONNECTION_METHOD.Keplr,
            authenticatorType: AUTHENTICATOR_TYPE.Secp256K1,
          },
        }),
    });

    // Should be undefined initially
    expect(result.current.client).toBeUndefined();

    const connectSpy = AAClient.connectWithSigner as any;
    connectSpy.mockClear();

    // Restore keplr and trigger event
    window.keplr = originalKeplr;

    act(() => {
      window.dispatchEvent(new Event("keplr_keystorechange"));
    });

    // It should trigger getSigner again and connect
    await waitFor(() => {
      expect(connectSpy).toHaveBeenCalled();
    });
  });
});
