import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DaoDaoTreasuryStrategy } from "../../treasury-strategies/daodao-treasury-strategy";
import type { AAClient } from "../../signers";
import { treasuryCacheManager } from "../../utils/cache";

// Mock the cache manager
vi.mock("../../utils/cache", () => ({
  treasuryCacheManager: {
    get: vi.fn(),
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe("DaoDaoTreasuryStrategy", () => {
  let strategy: DaoDaoTreasuryStrategy;
  let mockClient: AAClient;

  beforeEach(() => {
    strategy = new DaoDaoTreasuryStrategy();
    mockClient = {
      getChainId: vi.fn().mockResolvedValue("xion-mainnet-1"),
    } as unknown as AAClient;

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch treasury config from indexer successfully", async () => {
    const mockResponse = {
      grantConfigs: {
        "/cosmos.authz.v1beta1.MsgGrant": {
          authorization: {
            type_url: "/cosmos.authz.v1beta1.GenericAuthorization",
            value: "base64encodedvalue",
          },
          description: "Test grant",
        },
      },
      params: {
        redirect_url: "https://example.com/redirect",
        icon_url: "https://example.com/icon.png",
        metadata: JSON.stringify({ is_oauth2_app: false }),
      },
    };

    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    // Mock successful fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).not.toBeNull();
    expect(result?.grantConfigs).toHaveLength(1);
    expect(result?.grantConfigs[0].description).toBe("Test grant");
    expect(result?.params.display_url).toBeUndefined();
    expect(result?.params.redirect_url).toBe("https://example.com/redirect");
    expect(result?.params.icon_url).toBe("https://example.com/icon.png");
    expect(result?.params.metadata).toEqual({ is_oauth2_app: false });
  });

  it("should return cached data on subsequent calls", async () => {
    const mockResponse = {
      grantConfigs: {
        "/cosmos.authz.v1beta1.MsgGrant": {
          authorization: {
            type_url: "/cosmos.authz.v1beta1.GenericAuthorization",
            value: "base64encodedvalue",
          },
          description: "Cached grant",
        },
      },
      params: {
        redirect_url: "https://cached.com/redirect",
        icon_url: "https://cached.com/icon.png",
        metadata: JSON.stringify({ is_oauth2_app: true }),
      },
    };

    // Mock cache hit
    vi.mocked(treasuryCacheManager.get).mockResolvedValueOnce({
      data: mockResponse,
      fromCache: true,
    });

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).not.toBeNull();
    expect(result?.grantConfigs[0].description).toBe("Cached grant");
    expect(global.fetch).not.toHaveBeenCalled(); // Should not fetch when cache hit
  });

  it("should handle indexer error responses", async () => {
    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    // Mock error response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should handle network errors", async () => {
    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    // Mock network error
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should handle timeout errors", async () => {
    vi.useFakeTimers();
    const abortSpy = vi.spyOn(AbortController.prototype, "abort");

    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const promise = fetcher();
        // Advance time to trigger timeout
        vi.advanceTimersByTime(30000);
        const data = await promise;
        return { data, fromCache: false };
      },
    );

    // Mock fetch that hangs until aborted
    vi.mocked(global.fetch).mockImplementation((url, options) => {
      return new Promise((resolve, reject) => {
        if (options?.signal) {
          if (options.signal.aborted) {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            return reject(error);
          }
          options.signal.addEventListener("abort", () => {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            reject(error);
          });
        }
      });
    });

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
    expect(abortSpy).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("should validate response structure", async () => {
    const invalidResponse = {
      // Missing grantConfigs
      params: {
        redirect_url: "https://example.com",
        icon_url: "",
        metadata: "{}",
      },
    };

    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    // Mock invalid response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => invalidResponse,
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should handle unsafe URLs in params", async () => {
    const mockResponse = {
      grantConfigs: {},
      params: {
        redirect_url: "https://safe.com/",
        icon_url: "data:text/html,<script>alert('xss')</script>",
        metadata: JSON.stringify({ is_oauth2_app: false }),
      },
    };

    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    // Mock response with unsafe URLs
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).not.toBeNull();
    expect(result?.params.display_url).toBeUndefined();
    expect(result?.params.redirect_url).toBe("https://safe.com/"); // Safe URL preserved
    expect(result?.params.icon_url).toBe(""); // Unsafe URL should be empty
    expect(result?.params.metadata).toEqual({ is_oauth2_app: false });
  });

  it("should reject response that is not an object", async () => {
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => null,
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should reject response with missing params", async () => {
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ grantConfigs: {} }),
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should reject grant config that is not an object", async () => {
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        grantConfigs: {
          "/cosmos.authz.v1beta1.MsgGrant": null,
        },
        params: {},
      }),
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should reject grant config with missing authorization", async () => {
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        grantConfigs: {
          "/cosmos.authz.v1beta1.MsgGrant": {
            description: "Test grant",
          },
        },
        params: {},
      }),
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should reject grant config with invalid authorization format", async () => {
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        grantConfigs: {
          "/cosmos.authz.v1beta1.MsgGrant": {
            authorization: {
              type_url: 123, // Should be string
              value: "base64",
            },
            description: "Test grant",
          },
        },
        params: {},
      }),
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should reject grant config with missing description", async () => {
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        grantConfigs: {
          "/cosmos.authz.v1beta1.MsgGrant": {
            authorization: {
              type_url: "/cosmos.authz.v1beta1.GenericAuthorization",
              value: "base64",
            },
            // missing description
          },
        },
        params: {},
      }),
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).toBeNull();
  });

  it("should use custom indexer URL when provided", async () => {
    const customStrategy = new DaoDaoTreasuryStrategy(
      "https://custom-indexer.com",
    );
    const mockResponse = {
      grantConfigs: {},
      params: {
        redirect_url: "https://example.com/redirect",
        icon_url: "https://example.com/icon.png",
        metadata: JSON.stringify({ is_oauth2_app: false }),
      },
    };

    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    await customStrategy.fetchTreasuryConfig("xion1abc123", mockClient);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("https://custom-indexer.com"),
      expect.any(Object),
    );
  });

  it("should handle grant config with optional allowance", async () => {
    const mockResponse = {
      grantConfigs: {
        "/cosmos.authz.v1beta1.MsgGrant": {
          authorization: {
            type_url: "/cosmos.authz.v1beta1.GenericAuthorization",
            value: "base64encodedvalue",
          },
          description: "Test grant",
          allowance: {
            type_url: "/cosmos.feegrant.v1beta1.BasicAllowance",
            value: "allowancevalue",
          },
          maxDuration: 3600,
        },
      },
      params: {
        display_url: "https://example.com/",
        redirect_url: "https://example.com/redirect",
        icon_url: "https://example.com/icon.png",
      },
    };

    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).not.toBeNull();
    expect(result?.grantConfigs[0].allowance?.type_url).toBe(
      "/cosmos.feegrant.v1beta1.BasicAllowance",
    );
    expect(result?.grantConfigs[0].maxDuration).toBe(3600);
  });

  it("should sanitize unsafe URLs in params", async () => {
    const mockResponse = {
      grantConfigs: {},
      params: {
        redirect_url: "data:text/html,<script>alert('xss')</script>",
        icon_url: "https://example.com/icon.png", // Safe URL
        metadata: JSON.stringify({ is_oauth2_app: false }),
      },
    };

    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    // Mock successful fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).not.toBeNull();
    expect(result?.params.display_url).toBeUndefined();
    expect(result?.params.redirect_url).toBe(""); // Should be sanitized
    expect(result?.params.icon_url).toBe("https://example.com/icon.png"); // Should be preserved
    expect(result?.params.metadata).toEqual({ is_oauth2_app: false });
  });

  it("should handle missing or empty URLs", async () => {
    const mockResponse = {
      grantConfigs: {},
      params: {
        redirect_url: "", // Empty string
        icon_url: null, // Null
        metadata: "{}", // Empty metadata
      },
    };

    // Mock cache miss
    vi.mocked(treasuryCacheManager.get).mockImplementation(
      async (key, fetcher) => {
        const data = await fetcher();
        return { data, fromCache: false };
      },
    );

    // Mock successful fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await strategy.fetchTreasuryConfig(
      "xion1abc123",
      mockClient,
    );

    expect(result).not.toBeNull();
    expect(result?.params.display_url).toBeUndefined();
    expect(result?.params.redirect_url).toBe("");
    expect(result?.params.icon_url).toBe("");
    expect(result?.params.metadata).toEqual({});
  });
});
