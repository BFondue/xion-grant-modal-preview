import { describe, it, expect } from "vitest";
import {
  AASigner,
  AADefaultSigner,
} from "../../../signers/interfaces/AASigner";
import { SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";

class TestAASigner extends AASigner {
  getAccounts() {
    return Promise.resolve([]);
  }
}

describe("AASigner", () => {
  it("should initialize with abstract account", () => {
    const signer = new TestAASigner("xion1address");
    expect(signer.abstractAccount).toBe("xion1address");
  });

  it("should return default response from signDirect", async () => {
    const signer = new TestAASigner("xion1address");
    const signDoc = SignDoc.fromPartial({});
    const response = await signer.signDirect("xion1address", signDoc);

    expect(response.signed).toBe(signDoc);
    expect(response.signature.signature).toBe("");
    expect(response.signature.pub_key.type).toBe("tendermint/PubKeySecp256k1");
  });
});

describe("AADefaultSigner", () => {
  it("should initialize with abstract account", () => {
    const signer = new AADefaultSigner("xion1address");
    expect(signer.abstractAccount).toBe("xion1address");
  });

  it("should throw error when calling getAccounts", () => {
    const signer = new AADefaultSigner("xion1address");
    expect(() => signer.getAccounts()).toThrow(
      "Cannot get accounts from default signer",
    );
  });
});
