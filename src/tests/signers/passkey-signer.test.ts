import { describe, it, expect, vi, beforeEach } from "vitest";
import { AAPasskeySigner } from "../../signers/signers/passkey-signer";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
import { get } from "@github/webauthn-json/browser-ponyfill";

// Mock dependencies
vi.mock("@github/webauthn-json/browser-ponyfill", () => ({
  get: vi.fn(),
}));

vi.mock("../../utils/webauthn-utils", () => ({
  registeredCredentials: vi.fn().mockReturnValue([]),
}));

describe("AAPasskeySigner", () => {
  const mockAccount = "xion1mockaccount";
  const mockIndex = 0;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize correctly", () => {
    const signer = new AAPasskeySigner(mockAccount, mockIndex);
    expect(signer).toBeDefined();
  });

  it("should return accounts", async () => {
    const signer = new AAPasskeySigner(mockAccount, mockIndex);
    const accounts = await signer.getAccounts();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].address).toBe(mockAccount);
    expect(accounts[0].authenticatorId).toBe(mockIndex);
  });

  it("should return empty accounts if abstract account is undefined", async () => {
    const signer = new AAPasskeySigner(undefined as any, mockIndex);
    const accounts = await signer.getAccounts();
    expect(accounts).toHaveLength(0);
  });

  it("should sign direct", async () => {
    const signer = new AAPasskeySigner(mockAccount, mockIndex);
    const mockSignDoc = SignDoc.fromPartial({
      bodyBytes: new Uint8Array([1, 2, 3]),
      authInfoBytes: new Uint8Array([4, 5, 6]),
      chainId: "test-chain",
      accountNumber: 1n,
    });

    const mockCredential = {
      toJSON: () => ({ id: "mock-id", rawId: "mock-raw-id" }),
    };
    (get as any).mockResolvedValue(mockCredential);

    const response = await signer.signDirect("user", mockSignDoc);

    expect(response.signed).toEqual(mockSignDoc);
    expect(response.signature.signature).toBeDefined();
    expect(get).toHaveBeenCalled();
  });

  it("should throw error if abstract account is undefined during sign", async () => {
    const signer = new AAPasskeySigner(undefined as any, mockIndex);
    const mockSignDoc = SignDoc.fromPartial({});
    await expect(signer.signDirect("user", mockSignDoc)).rejects.toThrow(
      "No abstract account",
    );
  });
});
