import camelcaseKeys from "camelcase-keys";
import { AllowedMsgAllowance } from "cosmjs-types/cosmos/feegrant/v1beta1/feegrant";
import {
  Allowance,
  AllowanceResponse,
  ContractsAllowance,
  MultiAnyAllowance,
} from "../types/allowance-types";

/**
 * Validates if a requested action is permitted under a fee grant between a granter and grantee.
 *
 * @async
 * @function
 * @param {string} restUrl - The base URL of the Cosmos REST API.
 * @param {string} feeGranter - The address of the fee granter (the account providing the allowance).
 * @param {string} granter - The address of the grantee (the account receiving the allowance).
 * @param {string} requestedAction - The specific action to validate, e.g., "/cosmos.authz.v1beta1.MsgGrant".
 * @param {string} [userAddress] - (Optional) The user's smart contract account address to validate against `ContractsAllowance`.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the action is permitted under the fee grant, otherwise `false`.
 *
 * @throws {Error} - If the API request fails or an unexpected error occurs.
 */
export async function validateFeeGrant(
  restUrl: string,
  feeGranter: string,
  granter: string,
  requestedAction: string,
  userAddress?: string,
): Promise<boolean> {
  const baseUrl = `${restUrl}/cosmos/feegrant/v1beta1/allowance/${feeGranter}/${granter}`;
  try {
    const response = await fetch(baseUrl, { cache: "no-store" });
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    const camelCasedData = camelcaseKeys(data, {
      deep: true,
    }) as AllowanceResponse;

    const { allowance } = camelCasedData.allowance;
    return validateAction(requestedAction, allowance, userAddress);
  } catch (error) {
    // TODO: Return false on a network issue?
    console.error("Error validating fee grant:", error);
    return false;
  }
}

function isAllowedMsgAllowance(
  allowance: Allowance,
): allowance is AllowedMsgAllowance {
  return allowance["@type"] === "/cosmos.feegrant.v1beta1.AllowedMsgAllowance";
}

function isContractsAllowance(
  allowance: Allowance,
): allowance is ContractsAllowance {
  return allowance["@type"] === "/xion.v1.ContractsAllowance";
}

function isMultiAnyAllowance(
  allowance: Allowance,
): allowance is MultiAnyAllowance {
  return allowance["@type"] === "/xion.v1.MultiAnyAllowance";
}

export function validateAction(
  action: string,
  allowance: Allowance,
  userAddress?: string,
): boolean {
  if (isAllowedMsgAllowance(allowance)) {
    return allowance.allowedMessages.includes(action);
  }

  if (isContractsAllowance(allowance)) {
    if (userAddress && !allowance.contractAddresses.includes(userAddress)) {
      return false;
    }
    return validateAction(action, allowance.allowance, userAddress);
  }

  if (isMultiAnyAllowance(allowance)) {
    for (const subAllowance of allowance.allowances) {
      // Grant is true if ANY child grant is true
      if (validateAction(action, subAllowance, userAddress)) {
        return true;
      }
    }
    return true;
  }

  return false;
}
