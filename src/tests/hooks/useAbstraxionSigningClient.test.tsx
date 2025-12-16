import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAbstraxionSigningClient } from "../../hooks/useAbstraxionSigningClient";
import { AbstraxionContext } from "../../components/AbstraxionContext";

import { AADirectSigner, AAEthSigner, AbstractAccountJWTSigner, AAClient } from "../../signers";

const { mockGetTokens } = vi.hoisted(() => {
  const mockGetTokens = vi.fn().mockReturnValue({ session_token: "mock-token" });
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

vi.mock("../../signers", () => ({
  AAClient: {
    connectWithSigner: vi.fn().mockResolvedValue({
      addAccount: vi.fn(),
    }),
  },
  AADirectSigner: vi.fn(),
  AAEthSigner: vi.fn(),
  AbstractAccountJWTSigner: vi.fn(),
}));

vi.mock("../../signers/signers/passkey-signer", () => ({
  AAPasskeySigner: vi.fn(),
}));

vi.mock("../../utils/gas-utils", () => ({
  formatGasPrice: vi.fn().mockReturnValue({ amount: "0", denom: "uxion" }),
  getGasCalculation: vi.fn().mockReturnValue({
    gasPrice: { amount: "0", denom: "uxion" },
  }),
}));

vi.mock("../../config", () => ({
  STYTCH_PROXY_URL: "https://mock-stytch-proxy.com",
}));

describe("useAbstraxionSigningClient", () => {
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
    <AbstraxionContext.Provider
      value={{
        connectionType: "stytch",
        abstractAccount: mockAbstractAccount,
        chainInfo: mockChainInfo,
        isChainInfoLoading: false,
        ...contextValue,
      }}
    >
      {children}
    </AbstraxionContext.Provider>
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
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { connectionType: "stytch" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with shuttle (keplr)", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { connectionType: "shuttle" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with metamask", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { connectionType: "metamask" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with okx", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { connectionType: "okx" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return client when initialized with passkey", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { connectionType: "passkey" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should return undefined client if chain info is loading", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { isChainInfoLoading: true } }),
    });

    expect(result.current.client).toBeUndefined();
  });

  it("should return undefined client if abstract account is missing", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { abstractAccount: undefined } }),
    });

    expect(result.current.client).toBeUndefined();
  });

  it("should return undefined client if chain info is missing", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: (props) => wrapper({ ...props, contextValue: { chainInfo: undefined } }),
    });

    expect(result.current.client).toBeUndefined();
  });

  it("should initialize client with shuttle (Keplr) signer", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "shuttle" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should initialize client with okx signer", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "okx" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should initialize client with metamask signer", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "metamask" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should initialize client with passkey signer", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "passkey" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
  });

  it("should not initialize client with none connection type", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "none" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeUndefined();
    });
  });

  it("should handle missing signer gracefully", async () => {
    // Mock window.keplr to be undefined for shuttle connection
    const originalKeplr = window.keplr;
    delete (window as any).keplr;
    
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "shuttle" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeUndefined();
    });
    
    // Restore keplr
    window.keplr = originalKeplr;
  });

  it("should provide working okxSignArb function to AADirectSigner", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "okx" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });

    // Get the okxSignArb function passed to AADirectSigner
    const okxSignArb = (AADirectSigner as any).mock.calls[0][3];
    expect(okxSignArb).toBeDefined();

    // Test okxSignArb
    // Mock window.okxwallet.keplr.signArbitrary
    (window.okxwallet as any).keplr.signArbitrary.mockResolvedValue("signed-message");

    const signResult = await okxSignArb("chain-id", "account", "message");
    expect(signResult).toBe("signed-message");
    expect((window.okxwallet as any).keplr.enable).toHaveBeenCalledWith("xion-testnet-1");
    expect((window.okxwallet as any).keplr.signArbitrary).toHaveBeenCalledWith("chain-id", "account", "message");

    // Test with Uint8Array
    const uint8ArrayMessage = new Uint8Array([1, 2, 3]);
    await okxSignArb("chain-id", "account", uint8ArrayMessage);
    expect((window.okxwallet as any).keplr.signArbitrary).toHaveBeenCalledWith("chain-id", "account", uint8ArrayMessage);
  });

  it("should throw error in okxSignArb if okxwallet is missing", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "okx" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });

    const okxSignArb = (AADirectSigner as any).mock.calls[0][3];
    
    // Remove okxwallet
    const originalOkx = window.okxwallet;
    delete (window as any).okxwallet;

    await expect(okxSignArb("chain-id", "account", "message")).rejects.toThrow("Please install the OKX wallet extension");

    window.okxwallet = originalOkx;
  });

  it("should provide working ethSigningFn to AAEthSigner", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "metamask" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });

    const ethSigningFn = (AAEthSigner as any).mock.calls[0][2];
    expect(ethSigningFn).toBeDefined();

    // Mock window.ethereum.request
    (window.ethereum as any).request.mockImplementation(({ method }: any) => {
      if (method === "eth_requestAccounts") return Promise.resolve(["0xaccount"]);
      if (method === "personal_sign") return Promise.resolve("signed-message");
      return Promise.resolve(null);
    });

    const signResult = await ethSigningFn("message");
    expect(signResult).toBe("signed-message");
    expect((window.ethereum as any).request).toHaveBeenCalledWith({ method: "eth_requestAccounts" });
    expect((window.ethereum as any).request).toHaveBeenCalledWith({ 
      method: "personal_sign", 
      params: ["message", "0xaccount"] 
    });
  });

  it("should provide getGasCalculation function", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "stytch" } }),
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

  it("should handle missing ethereum in ethSigningFn", async () => {
    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "metamask" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });

    const ethSigningFn = (AAEthSigner as any).mock.calls[0][2];
    
    // Remove ethereum
    const originalEth = window.ethereum;
    delete (window as any).ethereum;

    // It should probably throw or return undefined/promise rejected
    // The code is:
    // const accounts = (await window.ethereum?.request({ method: "eth_requestAccounts" })) as any;
    // If window.ethereum is undefined, await undefined is undefined.
    // accounts will be undefined.
    // Then window.ethereum?.request(...) will be undefined.
    // So it returns undefined.
    
    const signResult = await ethSigningFn("message");
    expect(signResult).toBeUndefined();

    window.ethereum = originalEth;
  });

  it("should handle missing session token", async () => {
    // Mock useStytch to return null tokens
    mockGetTokens.mockReturnValue(null);

    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "stytch" } }),
    });

    await waitFor(() => {
      expect(result.current.client).toBeDefined();
    });
    
    // Verify that AbstractAccountJWTSigner was called with undefined session token
    expect(AbstractAccountJWTSigner).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      undefined, // sessionToken
      expect.anything()
    );

    // Restore mock
    mockGetTokens.mockReturnValue({ session_token: "mock-token" });
  });

  it("should update keplr state on keplr_keystorechange event", async () => {
    // Start with no keplr
    const originalKeplr = window.keplr;
    delete (window as any).keplr;

    const { result } = renderHook(() => useAbstraxionSigningClient(), {
      wrapper: ({ children }) =>
        wrapper({ children, contextValue: { connectionType: "shuttle" } }),
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
