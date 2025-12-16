import { expect, test } from "vitest";
import { validateActions } from "../../utils/validate-fee-grant";
import camelcaseKeys from "camelcase-keys";
import { AllowanceResponse } from "../../types/allowance-types";

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

const sampleResponseMissingMessages = {
  ...sampleResponse,
  allowance: {
    ...sampleResponse.allowance,
    allowance: {
      ...sampleResponse.allowance.allowance,
      allowances: sampleResponse.allowance.allowance.allowances.map(
        (allowance) =>
          allowance["@type"] === "/cosmos.feegrant.v1beta1.AllowedMsgAllowance"
            ? {
                ...allowance,
                allowed_messages: ["/cosmos.authz.v1beta1.MsgGrant"],
              }
            : allowance,
      ),
    },
  },
};

test("validateActions - valid case with matching allowed messages", async () => {
  const camelCasedData = camelcaseKeys(sampleResponse, {
    deep: true,
  }) as AllowanceResponse;

  const { allowance } = camelCasedData.allowance;

  const r = validateActions(
    ["/cosmos.authz.v1beta1.MsgGrant", "/cosmwasm.wasm.v1.MsgExecuteContract"],
    allowance,
    "xion1jrdchvdk3807rjq86gcjma67gae7k9acj0z5p65p6gc7qlnsr5ksnr0pv5",
  );

  expect(r).toBeTruthy();
});

test("validateActions - invalid case with missing allowed messages", async () => {
  const camelCasedData = camelcaseKeys(sampleResponseMissingMessages, {
    deep: true,
  }) as AllowanceResponse;

  const { allowance } = camelCasedData.allowance;

  const r = validateActions(
    ["/cosmos.authz.v1beta1.MsgGrant", "/cosmwasm.wasm.v1.MsgExecuteContract"],
    allowance,
    "xion1jrdchvdk3807rjq86gcjma67gae7k9acj0z5p65p6gc7qlnsr5ksnr0pv5",
  );

  expect(r).toBeFalsy();
});
