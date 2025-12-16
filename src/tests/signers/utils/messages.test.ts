import { describe, it, expect } from "vitest";
import {
  isMsgRegisterAccount,
  isMsgRegisterAccountResponse,
  typeUrlMsgRegisterAccount,
  typeUrlMsgRegisterAccountResponse,
} from "../../../signers/signers/utils/messages";

describe("messages utils", () => {
  describe("isMsgRegisterAccount", () => {
    it("should return true for valid MsgRegisterAccount encode object", () => {
      const encodeObject = {
        typeUrl: typeUrlMsgRegisterAccount,
        value: {},
      };
      expect(isMsgRegisterAccount(encodeObject)).toBe(true);
    });

    it("should return false for invalid encode object", () => {
      const encodeObject = {
        typeUrl: "/some.other.Type",
        value: {},
      };
      expect(isMsgRegisterAccount(encodeObject)).toBe(false);
    });
  });

  describe("isMsgRegisterAccountResponse", () => {
    it("should return true for valid MsgRegisterAccountResponse encode object", () => {
      const encodeObject = {
        typeUrl: typeUrlMsgRegisterAccountResponse,
        value: {},
      };
      expect(isMsgRegisterAccountResponse(encodeObject)).toBe(true);
    });

    it("should return false for invalid encode object", () => {
      const encodeObject = {
        typeUrl: "/some.other.Type",
        value: {},
      };
      expect(isMsgRegisterAccountResponse(encodeObject)).toBe(false);
    });
  });
});
