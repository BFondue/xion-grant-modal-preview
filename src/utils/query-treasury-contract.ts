import {
  AuthorizationTypes,
  decodeAuthorization,
  DecodedReadableAuthorization,
  HumanContractExecAuth,
} from "@burnt-labs/abstraxion-core";
import type { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { GenericAuthorization } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { StakeAuthorization } from "cosmjs-types/cosmos/staking/v1beta1/authz";
import { SendAuthorization } from "cosmjs-types/cosmos/bank/v1beta1/authz";
import type {
  GrantConfigByTypeUrl,
  GrantConfigTypeUrlsResponse,
  PermissionDescription,
  TreasuryParams,
} from "../types/treasury-types";
import type { AAClient } from "../signers";
import { isUrlSafe } from "./url";

export function formatXionAmount(amount: string, denom: string): string {
  if (denom === "uxion") {
    // Handle invalid inputs
    const numAmount = Number(amount);
    if (isNaN(numAmount)) {
      return `${amount} ${denom}`;
    }

    // Handle negative numbers
    if (numAmount < 0) {
      return `${amount} ${denom}`;
    }

    const value = numAmount / Math.pow(10, 6);
    // Format with 6 decimal places and remove trailing zeros
    const formattedValue = value.toFixed(6).replace(/\.?0+$/, "");
    return `${formattedValue} XION`;
  }
  return `${amount} ${denom}`;
}

const CosmosAuthzPermission: { [key: string]: string } = {
  "/cosmos.bank.v1beta1.MsgSend": "send tokens from your account",
  "/cosmos.staking.v1beta1.MsgDelegate": "delegate your tokens",
  "/cosmos.staking.v1beta1.MsgUndelegate": "undelegate your tokens",
  "/cosmos.staking.v1beta1.MsgBeginRedelegate": "redelegate your tokens",
  "/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward":
    "withdraw your staking rewards",
  "/cosmos.gov.v1beta1.MsgVote": "vote on governance proposals on your behalf",
  "/ibc.applications.transfer.v1.MsgTransfer": "transfer your tokens via IBC",
  "/cosmos.authz.v1beta1.MsgExec": "execute transactions on your behalf",
  "/cosmos.crisis.v1beta1.MsgVerifyInvariant":
    "verify network invariants on your behalf",
  "/cosmos.evidence.v1beta1.MsgSubmitEvidence":
    "submit evidence on your behalf",
  "/cosmos.feegrant.v1beta1.MsgGrantAllowance":
    "manage fee allowances on your behalf",
  "/cosmos.feegrant.v1beta1.MsgRevokeAllowance":
    "revoke fee allowances on your behalf",
  "/cosmos.gov.v1beta1.MsgDeposit":
    "deposit tokens for governance proposals on your behalf",
  "/cosmos.gov.v1beta1.MsgSubmitProposal":
    "submit governance proposals on your behalf",
  "/cosmos.slashing.v1beta1.MsgUnjail": "unjail your validator",
  "/cosmos.vesting.v1beta1.MsgCreateVestingAccount":
    "create vesting accounts on your behalf",
  "/cosmwasm.wasm.v1.MsgStoreCode": "store smart contract code on your behalf",
  "/cosmwasm.wasm.v1.MsgInstantiateContract":
    "instantiate smart contracts on your behalf",
  "/cosmwasm.wasm.v1.MsgInstantiateContract2":
    "instantiate smart contracts on your behalf",
  "/cosmwasm.wasm.v1.MsgExecuteContract":
    "execute smart contracts on your behalf",
  "/cosmwasm.wasm.v1.MsgMigrateContract":
    "migrate smart contracts on your behalf",
  "/cosmwasm.wasm.v1.MsgUpdateAdmin":
    "update the admin of smart contracts on your behalf",
  "/cosmwasm.wasm.v1.MsgClearAdmin":
    "clear the admin of smart contracts on your behalf",
};

export interface TreasuryContractResponse {
  permissionDescriptions: PermissionDescription[];
  params: TreasuryParams;
}

/**
 * Queries the DAPP treasury contract to parse and display requested permissions to end user
 * @param {string} contractAddress - The address for the deployed treasury contract instance
 * @param {AAClient} client - Client to query RPC
 * @param {string} account - Users account address
 * @returns {TreasuryContractResponse} - The human-readable permission descriptions and treasury parameters
 */
export const queryTreasuryContract = async (
  contractAddress?: string,
  client?: AAClient,
  account?: string,
): Promise<TreasuryContractResponse> => {
  if (!contractAddress) {
    throw new Error("Missing contract address");
  }

  if (!client) {
    throw new Error("Missing client");
  }

  if (!account) {
    throw new Error("Missing account");
  }

  const queryTreasuryContractMsg = {
    grant_config_type_urls: {},
  };

  const queryParams = { params: {} };

  // Query params with safe fallback
  const safeQueryParams = async (): Promise<TreasuryParams> => {
    try {
      const params = (await client.queryContractSmart(
        contractAddress,
        queryParams,
      )) as TreasuryParams;

      // Validate URLs even when successfully queried
      return {
        display_url: isUrlSafe(params.display_url) ? params.display_url : "",
        redirect_url: isUrlSafe(params.redirect_url) ? params.redirect_url : "",
        icon_url: isUrlSafe(params.icon_url) ? params.icon_url : "",
      };
    } catch (error) {
      console.warn("Error querying params:", error);
      return {
        display_url: "",
        redirect_url: "",
        icon_url: "",
      };
    }
  };

  // Query all grant config type urls and params in parallel
  const [queryAllTypeUrlsResponse, paramsResponse] = await Promise.all([
    client.queryContractSmart(
      contractAddress,
      queryTreasuryContractMsg,
    ) as Promise<GrantConfigTypeUrlsResponse>,
    safeQueryParams(),
  ]);

  if (!queryAllTypeUrlsResponse) {
    throw new Error(
      "Something went wrong querying the treasury contract for grants",
    );
  }

  const decodedGrantsWithDappDescription: (DecodedReadableAuthorization & {
    dappDescription: string;
  })[] = await Promise.all(
    queryAllTypeUrlsResponse.map(async (grant) => {
      const queryByMsg = {
        grant_config_by_type_url: {
          msg_type_url: grant,
        },
      };

      const queryGrantConfigResponse: GrantConfigByTypeUrl =
        await client.queryContractSmart(contractAddress, queryByMsg);

      if (!queryGrantConfigResponse || !queryGrantConfigResponse.description) {
        throw new Error("Something went wrong querying the grant config");
      }

      return {
        ...decodeAuthorization(
          queryGrantConfigResponse.authorization.type_url,
          queryGrantConfigResponse.authorization.value,
        ),
        dappDescription: queryGrantConfigResponse.description,
      };
    }),
  );

  // For each grant type url, query grant config and construct a human readable description
  const permissionDescriptions: PermissionDescription[] =
    decodedGrantsWithDappDescription.map((decodedGrant) => {
      let description: string;
      const contracts: string[] = [];
      switch (decodedGrant.type) {
        case AuthorizationTypes.Generic: {
          // These msg type urls combined with a GenericAuthorization are dangerous. Prevent flow
          // TODO - Uncomment when proxy contract integrated, or find a solution for DevPortal
          const genericMsg = (decodedGrant.data as GenericAuthorization).msg;
          if (
            // genericMsg === "/cosmwasm.wasm.v1.MsgExecuteContract" ||
            // genericMsg === "/cosmwasm.wasm.v1.MsgMigrateContract" ||
            // genericMsg === "/cosmos.authz.v1beta1.MsgExec" ||
            // genericMsg === "/cosmwasm.wasm.v1.MsgStoreCode" ||
            // genericMsg === "/cosmwasm.wasm.v1.MsgUpdateAdmin" ||
            // genericMsg === "/cosmwasm.wasm.v1.MsgClearAdmin" ||
            genericMsg === "/cosmos.bank.v1beta1.MsgSend"
          ) {
            throw new Error("Misconfigured grant config");
          }
          description = `Permission to ${
            CosmosAuthzPermission[
              (decodedGrant.data as GenericAuthorization).msg
            ]
          }`;
          break;
        }
        case AuthorizationTypes.Send: {
          const spendLimit = (decodedGrant.data as SendAuthorization).spendLimit
            .map((limit: Coin) => formatXionAmount(limit.amount, limit.denom))
            .join(", ");
          const allowList = (
            decodedGrant.data as SendAuthorization
          ).allowList.join(", ");
          description = `Permission to send tokens with spend limit: ${spendLimit} ${allowList && `and allow list: ${allowList}`}`;
          break;
        }
        case AuthorizationTypes.Stake: {
          const allowedValidators = (
            decodedGrant.data as StakeAuthorization
          ).allowList?.address?.join(", ");
          const deniedValidators = (
            decodedGrant.data as StakeAuthorization
          ).denyList?.address?.join(", ");
          const maxTokens = formatXionAmount(
            (decodedGrant.data as StakeAuthorization)?.maxTokens?.amount ?? "",
            (decodedGrant.data as StakeAuthorization)?.maxTokens?.denom ?? "",
          );
          description = `Permission to stake tokens ${
            allowedValidators
              ? `with allowed validators: ${allowedValidators}`
              : "without specified validators"
          } ${
            deniedValidators
              ? `, denying validators: ${deniedValidators}`
              : "without denied validators"
          } and max tokens: ${maxTokens}`;
          break;
        }
        case AuthorizationTypes.ContractExecution: {
          description = "Permission to execute smart contracts";
          (decodedGrant.data as HumanContractExecAuth)?.grants.map((grant) => {
            if (grant.address === account) {
              throw new Error("Misconfigured treasury contract");
            }
            contracts.push(grant.address);
          });
          break;
        }
        default:
          description = `Unknown Authorization Type: ${decodedGrant.type}`;
      }
      return {
        authorizationDescription: description,
        dappDescription: decodedGrant.dappDescription,
        contracts,
      };
    });

  return {
    permissionDescriptions,
    params: paramsResponse,
  };
};
