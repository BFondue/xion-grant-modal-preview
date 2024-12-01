import { expect, test } from "vitest";
import { validateAction } from "./validate-fee-grant";
import camelcaseKeys from "camelcase-keys";
import { AllowanceResponse } from "../types/allowance-types";

const sampleResponse = {
  allowance: {
    granter: "xion1aqpmfnr9uxatc9yfhmutenwtqlpyhk8s3csdkm",
    grantee: "xion1jrdchvdk3807rjq86gcjma67gae7k9acj0z5p65p6gc7qlnsr5ksnr0pv5",
    allowance: {
      "@type": "/xion.v1.MultiAnyAllowance",
      allowances: [
        {
          "@type": "/xion.v1.ContractsAllowance",
          allowance: {
            "@type": "/cosmos.feegrant.v1beta1.PeriodicAllowance",
            basic: {
              spend_limit: [],
              expiration: null,
            },
            period: "86400s",
            period_spend_limit: [
              {
                denom: "uxion",
                amount: "100000",
              },
            ],
            period_can_spend: [],
            period_reset: "1970-01-01T00:00:00Z",
          },
          contract_addresses: [
            "xion1jrdchvdk3807rjq86gcjma67gae7k9acj0z5p65p6gc7qlnsr5ksnr0pv5",
          ],
        },
        {
          "@type": "/cosmos.feegrant.v1beta1.AllowedMsgAllowance",
          allowance: {
            "@type": "/cosmos.feegrant.v1beta1.PeriodicAllowance",
            basic: {
              spend_limit: [],
              expiration: null,
            },
            period: "86400s",
            period_spend_limit: [
              {
                denom: "uxion",
                amount: "100000",
              },
            ],
            period_can_spend: [],
            period_reset: "1970-01-01T00:00:00Z",
          },
          allowed_messages: [
            "/cosmos.authz.v1beta1.MsgGrant",
            "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
            "/cosmwasm.wasm.v1.MsgExecuteContract",
            "/cosmwasm.wasm.v1.MsgMigrateContract",
          ],
        },
      ],
    },
  },
};

test("validateAction", async () => {
  const camelCasedData = camelcaseKeys(sampleResponse, {
    deep: true,
  }) as AllowanceResponse;

  const { allowance } = camelCasedData.allowance;

  const r = validateAction(
    "/cosmos.authz.v1beta1.MsgGrant",
    allowance,
    "xion1jrdchvdk3807rjq86gcjma67gae7k9acj0z5p65p6gc7qlnsr5ksnr0pv5",
  );

  expect(r).toBeTruthy();
});
