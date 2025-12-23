import type { MsgGrant } from "cosmjs-types/cosmos/authz/v1beta1/tx";

export type GrantConfigTypeUrlsResponse = string[];

export interface TreasuryParamsMetadata extends Record<string, unknown> {
  is_oauth2_app?: boolean;
}

// TypeScript representation (metadata is parsed object)
export interface TreasuryParams {
  display_url?: string; // for backwards compatibility
  redirect_url: string;
  icon_url: string;
  metadata: TreasuryParamsMetadata;
}

// Chain representation (metadata is JSON string)
export interface TreasuryParamsChain {
  redirect_url: string;
  icon_url: string;
  metadata: string;
}

// Helper function to parse chain TreasuryParams to TypeScript TreasuryParams
export function parseTreasuryParams(
  chainParams: TreasuryParamsChain,
): TreasuryParams {
  let metadata: TreasuryParamsMetadata = {};
  try {
    if (chainParams.metadata) {
      metadata = JSON.parse(chainParams.metadata) as TreasuryParamsMetadata;
    }
  } catch (error) {
    console.warn("Failed to parse treasury params metadata:", error);
    metadata = {};
  }

  return {
    display_url: undefined,
    redirect_url: chainParams.redirect_url,
    icon_url: chainParams.icon_url,
    metadata,
  };
}

export interface GrantConfigByTypeUrl {
  allowance: Any;
  authorization: Any;
  description: string;
  maxDuration?: number;
}

export interface PermissionDescription {
  authorizationDescription: string;
  dappDescription?: string;
  contracts?: string[];
}

export interface FormattedDescriptions {
  parsedDescription: string;
  dappDescription: string;
}

export interface GeneratedAuthzGrantMessage {
  typeUrl: string;
  value: MsgGrant;
}

export interface Any {
  type_url: string;
  value: string;
}
