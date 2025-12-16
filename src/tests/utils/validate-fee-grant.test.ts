import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  validateFeeGrant,
  validateActions,
} from "../../utils/validate-fee-grant";
import { Allowance } from "../../types/allowance-types";

describe("validateFeeGrant", () => {
  const restUrl = "https://api.testnet.xion.burnt.com";
  const feeGranter = "xion1granter";
  const granter = "xion1grantee";
  const requestedActions = ["/cosmos.bank.v1beta1.MsgSend"];

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when fee grant is valid and allows actions", async () => {
    const mockResponse = {
      allowance: {
        allowance: {
          "@type": "/cosmos.feegrant.v1beta1.AllowedMsgAllowance",
          allowed_messages: ["/cosmos.bank.v1beta1.MsgSend"],
          allowance: {
            "@type": "/cosmos.feegrant.v1beta1.BasicAllowance",
          },
        },
      },
    };

    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await validateFeeGrant(
      restUrl,
      feeGranter,
      granter,
      requestedActions,
    );
    expect(result).toBe(true);
  });

  it("returns false when fetch fails", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: false,
    } as Response);

    const result = await validateFeeGrant(
      restUrl,
      feeGranter,
      granter,
      requestedActions,
    );
    expect(result).toBe(false);
  });

  it("returns false when fetch throws error", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("Network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await validateFeeGrant(
      restUrl,
      feeGranter,
      granter,
      requestedActions,
    );
    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("validateActions", () => {
  it("validates AllowedMsgAllowance", () => {
    const allowance: Allowance = {
      "@type": "/cosmos.feegrant.v1beta1.AllowedMsgAllowance",
      allowedMessages: ["/cosmos.bank.v1beta1.MsgSend"],
      allowance: { "@type": "basic" } as any,
    };

    expect(validateActions(["/cosmos.bank.v1beta1.MsgSend"], allowance)).toBe(
      true,
    );
    expect(
      validateActions(["/cosmos.staking.v1beta1.MsgDelegate"], allowance),
    ).toBe(false);
  });

  it("validates ContractsAllowance", () => {
    const allowance: Allowance = {
      "@type": "/xion.v1.ContractsAllowance",
      contractAddresses: ["xion1contract"],
      allowance: {
        "@type": "/cosmos.feegrant.v1beta1.AllowedMsgAllowance",
        allowedMessages: ["/cosmwasm.wasm.v1.MsgExecuteContract"],
        allowance: { "@type": "basic" } as any,
      },
    };

    expect(
      validateActions(
        ["/cosmwasm.wasm.v1.MsgExecuteContract"],
        allowance,
        "xion1contract",
      ),
    ).toBe(true);
    expect(
      validateActions(
        ["/cosmwasm.wasm.v1.MsgExecuteContract"],
        allowance,
        "xion1other",
      ),
    ).toBe(false);
  });

  it("validates MultiAnyAllowance", () => {
    const allowance: Allowance = {
      "@type": "/xion.v1.MultiAnyAllowance",
      allowances: [
        {
          "@type": "/cosmos.feegrant.v1beta1.AllowedMsgAllowance",
          allowedMessages: ["/cosmos.bank.v1beta1.MsgSend"],
          allowance: { "@type": "basic" } as any,
        },
        {
          "@type": "/cosmos.feegrant.v1beta1.AllowedMsgAllowance",
          allowedMessages: ["/cosmos.staking.v1beta1.MsgDelegate"],
          allowance: { "@type": "basic" } as any,
        },
      ],
    };

    expect(validateActions(["/cosmos.bank.v1beta1.MsgSend"], allowance)).toBe(
      true,
    );
    expect(
      validateActions(["/cosmos.staking.v1beta1.MsgDelegate"], allowance),
    ).toBe(true);
    expect(validateActions(["/cosmos.gov.v1beta1.MsgVote"], allowance)).toBe(
      false,
    );
  });

  it("returns false for unknown allowance type", () => {
    const allowance = {
      "@type": "/unknown.Allowance",
    } as any;

    expect(validateActions(["action"], allowance)).toBe(false);
  });
});
