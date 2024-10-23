import type { MsgGrant } from "cosmjs-types/cosmos/authz/v1beta1/tx";

export type GrantConfigTypeUrlsResponse = string[];

export interface GrantConfigByTypeUrl {
  allowance: Any;
  authorization: Any;
  description: string;
  maxDuration?: number;
}

export interface PermissionDescription {
  authorizationDescription: string;
  dappDescription?: string;
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
