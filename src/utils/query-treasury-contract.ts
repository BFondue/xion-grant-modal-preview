import type { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import { GenericAuthorization } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import { StakeAuthorization } from "cosmjs-types/cosmos/staking/v1beta1/authz";
import { SendAuthorization } from "cosmjs-types/cosmos/bank/v1beta1/authz";
import { ContractExecutionAuthorization } from "cosmjs-types/cosmwasm/wasm/v1/authz";
import type {
  GrantConfigByTypeUrl,
  GrantConfigTypeUrlsResponse,
  PermissionDescription,
  TreasuryParams,
} from "../types/treasury-types";
import type { AAClient } from "../signers";

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
  contractAddress: string,
  client: AAClient,
  account: string,
): Promise<TreasuryContractResponse> => {
  if (!contractAddress) {
    throw new Error("Missing contract address");
  }

  if (!client) {
    throw new Error("Missing client");
  }

  const queryTreasuryContractMsg = {
    grant_config_type_urls: {},
  };

  const queryParams = { params: {} };

  // Query params with safe fallback
  const safeQueryParams = async (): Promise<TreasuryParams> => {
    try {
      return (await client.queryContractSmart(
        contractAddress,
        queryParams,
      )) as TreasuryParams;
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

  // For each grant type url, query grant config and construct a human readable description
  const permissionDescriptions: PermissionDescription[] = await Promise.all(
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
      let description: string;
      const contracts = [];
      switch (queryGrantConfigResponse.authorization.type_url) {
        case "/cosmos.authz.v1beta1.GenericAuthorization": {
          // These msg type urls combined with a GenericAuthorization are dangerous. Prevent flow
          // TODO - Uncomment when proxy contract integrated, or find a solution for DevPortal
          // if (
          //   grant === "/cosmwasm.wasm.v1.MsgExecuteContract" ||
          //   grant === "/cosmwasm.wasm.v1.MsgMigrateContract" ||
          //   grant === "/cosmos.authz.v1beta1.MsgExec" ||
          //   grant === "/cosmwasm.wasm.v1.MsgStoreCode" ||
          //   grant === "/cosmwasm.wasm.v1.MsgUpdateAdmin" ||
          //   grant === "/cosmwasm.wasm.v1.MsgClearAdmin"
          // ) {
          //   throw new Error("Misconfigured grant config");
          // }
          const genericAuthByteArray = new Uint8Array(
            Buffer.from(queryGrantConfigResponse.authorization.value, "base64"),
          );
          const decodedGenericAuth =
            GenericAuthorization.decode(genericAuthByteArray);
          description = `Permission to ${
            CosmosAuthzPermission[decodedGenericAuth.msg]
          }`;
          break;
        }
        case "/cosmos.bank.v1beta1.SendAuthorization": {
          const sendAuthByteArray = new Uint8Array(
            Buffer.from(queryGrantConfigResponse.authorization.value, "base64"),
          );
          const decodedSendAuth = SendAuthorization.decode(sendAuthByteArray);
          const spendLimit = decodedSendAuth.spendLimit
            .map((limit: Coin) => formatXionAmount(limit.amount, limit.denom))
            .join(", ");
          const allowList = decodedSendAuth.allowList.join(", ");
          description = `Permission to send tokens with spend limit: ${spendLimit} ${allowList && `and allow list: ${allowList}`}`;
          break;
        }
        case "/cosmos.staking.v1beta1.StakeAuthorization": {
          const stakeAuthByteArray = new Uint8Array(
            Buffer.from(queryGrantConfigResponse.authorization.value, "base64"),
          );
          const decodedStakeAuth =
            StakeAuthorization.decode(stakeAuthByteArray);
          const allowedValidators =
            decodedStakeAuth.allowList?.address?.join(", ");
          const deniedValidators =
            decodedStakeAuth.denyList?.address?.join(", "); // TODO: Impl
          const maxTokens = formatXionAmount(
            decodedStakeAuth.maxTokens.amount,
            decodedStakeAuth.maxTokens.denom,
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
        case "/cosmwasm.wasm.v1.ContractExecutionAuthorization": {
          const contractExecAuthByteArray = new Uint8Array(
            Buffer.from(queryGrantConfigResponse.authorization.value, "base64"),
          );
          const decodedContractExecAuth = ContractExecutionAuthorization.decode(
            contractExecAuthByteArray,
          );
          description = "Permission to execute smart contracts";
          decodedContractExecAuth.grants.map((grant) => {
            if (grant.contract === account) {
              throw new Error("Misconfigured treasury contract");
            }
            contracts.push(grant.contract);
          });
          break;
        }
        default:
          description = `Unknown Authorization Type: ${queryGrantConfigResponse.authorization["@type"]}`;
      }
      return {
        authorizationDescription: description,
        dappDescription: queryGrantConfigResponse.description,
        contracts,
      };
    }),
  );

  return {
    permissionDescriptions,
    params: paramsResponse,
  };
};
