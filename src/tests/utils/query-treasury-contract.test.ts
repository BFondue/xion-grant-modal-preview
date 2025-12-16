import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatCoins,
  formatXionAmount,
  queryTreasuryContract,
} from "../../utils/query-treasury-contract";
import { USDC_DENOM } from "../../config";
import { AuthorizationTypes } from "@burnt-labs/abstraxion-core";

// Mock dependencies
vi.mock("../../hooks/useTreasuryStrategy", () => ({
  getTreasuryStrategy: vi.fn(),
}));

vi.mock("@burnt-labs/abstraxion-core", async () => {
  const actual = await vi.importActual("@burnt-labs/abstraxion-core");
  return {
    ...actual,
    decodeAuthorization: vi.fn(),
  };
});

import { getTreasuryStrategy } from "../../hooks/useTreasuryStrategy";
import { decodeAuthorization } from "@burnt-labs/abstraxion-core";

describe("formatCoins", () => {
  it("formats empty string", () => {
    expect(formatCoins("")).toBe("");
  });

  it("formats USDC", () => {
    expect(formatCoins(`1000000${USDC_DENOM}`)).toBe("1 USDC");
  });

  it("formats XION", () => {
    expect(formatCoins("1000000uxion")).toBe("1 XION");
  });

  it("formats unknown denom", () => {
    expect(formatCoins("100unknown")).toBe("100 UNKNOWN");
  });

  it("returns empty string for invalid coin format", () => {
    // parseCoinString returns empty array for strings without valid amount/denom
    expect(formatCoins("invalidcoin")).toBe("");
  });

  it("formats known denom without u prefix as-is", () => {
    // "xion" is a known denom but doesn't start with 'u', so it should not convert
    expect(formatCoins("100xion")).toBe("100 XION");
  });

  it("handles multiple coins with some invalid", () => {
    expect(formatCoins("1000000uxion,invalid,100uatom")).toBe(
      "1 XION, 100 UATOM",
    );
  });
});

describe("formatXionAmount", () => {
  it("formats uxion correctly", () => {
    expect(formatXionAmount("1000000", "uxion")).toBe("1 XION");
    expect(formatXionAmount("1500000", "uxion")).toBe("1.5 XION");
  });

  it("handles invalid input for uxion", () => {
    expect(formatXionAmount("invalid", "uxion")).toBe("invalid uxion");
  });

  it("handles negative input for uxion", () => {
    expect(formatXionAmount("-1000000", "uxion")).toBe("-1000000 uxion");
  });

  it("formats other denoms as is", () => {
    expect(formatXionAmount("100", "uatom")).toBe("100 uatom");
  });
});

describe("queryTreasuryContract", () => {
  const mockClient = {} as any;
  const mockStrategy = {
    fetchTreasuryConfig: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(getTreasuryStrategy).mockReturnValue(mockStrategy);
    vi.mocked(decodeAuthorization).mockReset();
  });

  it("throws if arguments are missing", async () => {
    await expect(
      queryTreasuryContract(undefined, mockClient, "account"),
    ).rejects.toThrow("Missing contract address");
    await expect(
      queryTreasuryContract("addr", undefined, "account"),
    ).rejects.toThrow("Missing client");
    await expect(
      queryTreasuryContract("addr", mockClient, undefined),
    ).rejects.toThrow("Missing account");
  });

  it("throws if treasury config fetch fails", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue(null);
    await expect(
      queryTreasuryContract("addr", mockClient, "account"),
    ).rejects.toThrow("Something went wrong");
  });

  it("processes generic authorization", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.Generic,
      data: { msg: "/cosmos.bank.v1beta1.MsgSend" },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "Permission to send tokens",
    );
  });

  it("processes send authorization", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.Send,
      data: {
        spendLimit: [{ amount: "1000000", denom: "uxion" }],
        allowList: ["addr1", "addr2"],
      },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "Permission to send tokens with spend limit: 1 XION and allow list: addr1, addr2",
    );
  });

  it("processes ibc transfer authorization", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.IbcTransfer,
      data: {
        allocations: [
          {
            spendLimit: [{ amount: "1000000", denom: "uxion" }],
            allowList: ["channel-0"],
          },
        ],
      },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "Permission to transfer tokens via IBC with the following limits: 1 XION to channel-0",
    );
  });

  it("processes ibc transfer authorization with empty allowList", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.IbcTransfer,
      data: {
        allocations: [
          {
            spendLimit: [{ amount: "1000000", denom: "uxion" }],
            allowList: [],
          },
        ],
      },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "to any channel",
    );
  });

  it("processes stake authorization", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.Stake,
      data: {
        allowList: { address: ["val1"] },
        maxTokens: { amount: "1000000", denom: "uxion" },
      },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "Permission to stake tokens with allowed validators: val1 without denied validators and max tokens: 1 XION",
    );
  });

  it("processes stake authorization with denyList", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.Stake,
      data: {
        denyList: { address: ["badval1", "badval2"] },
        maxTokens: { amount: "1000000", denom: "uxion" },
      },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "without specified validators",
    );
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "denying validators: badval1, badval2",
    );
  });

  it("processes stake authorization without maxTokens", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.Stake,
      data: {
        allowList: { address: ["val1"] },
        // no maxTokens
      },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "with allowed validators: val1",
    );
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "max tokens:",
    );
  });

  it("processes contract execution authorization", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.ContractExecution,
      data: {
        grants: [{ address: "contract1" }],
      },
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "Permission to execute smart contracts",
    );
    expect(result.permissionDescriptions[0].contracts).toContain("contract1");
  });

  it("throws error for contract execution authorization if grant address matches account", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: AuthorizationTypes.ContractExecution,
      data: {
        grants: [{ address: "account" }],
      },
    } as any);

    await expect(
      queryTreasuryContract("addr", mockClient, "account"),
    ).rejects.toThrow("Misconfigured treasury contract");
  });

  it("handles unknown authorization type", async () => {
    mockStrategy.fetchTreasuryConfig.mockResolvedValue({
      grantConfigs: [
        {
          authorization: { type_url: "type", value: "val" },
          description: "dapp desc",
        },
      ],
      params: {},
    });

    vi.mocked(decodeAuthorization).mockReturnValue({
      type: "unknown",
      data: {},
    } as any);

    const result = await queryTreasuryContract("addr", mockClient, "account");
    expect(result.permissionDescriptions[0].authorizationDescription).toContain(
      "Unknown Authorization Type: unknown",
    );
  });
});
