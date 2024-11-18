import { MsgVote } from "cosmjs-types/cosmos/gov/v1beta1/tx";
import { MsgGrant } from "cosmjs-types/cosmos/authz/v1beta1/tx";
import { GenericAuthorization } from "cosmjs-types/cosmos/authz/v1beta1/authz";
import {
  AllowedMsgAllowance,
  BasicAllowance,
} from "cosmjs-types/cosmos/feegrant/v1beta1/feegrant";
import { MsgGrantAllowance } from "cosmjs-types/cosmos/feegrant/v1beta1/tx";

export const generateGovernanceGrant = (
  expiration: bigint,
  grantee: string,
  granter: string,
): Array<{
  typeUrl: string;
  value: MsgGrant | MsgGrantAllowance;
}> => {
  const feeGrant = {
    typeUrl: MsgGrantAllowance.typeUrl,
    value: MsgGrantAllowance.fromPartial({
      allowance: {
        typeUrl: AllowedMsgAllowance.typeUrl,
        value: AllowedMsgAllowance.encode(
          AllowedMsgAllowance.fromPartial({
            allowance: {
              typeUrl: BasicAllowance.typeUrl,
              value: BasicAllowance.encode(
                BasicAllowance.fromPartial({
                  spendLimit: [],
                  expiration: {
                    seconds: expiration,
                  },
                }),
              ).finish(),
            },
            allowedMessages: [MsgVote.typeUrl],
          }),
        ).finish(),
      },
      grantee,
      granter,
    }),
  };

  const voteGrant = {
    typeUrl: MsgGrant.typeUrl,
    value: MsgGrant.fromPartial({
      grant: {
        authorization: {
          typeUrl: GenericAuthorization.typeUrl,
          value: GenericAuthorization.encode(
            GenericAuthorization.fromPartial({
              msg: MsgVote.typeUrl,
            }),
          ).finish(),
        },
        expiration: {
          seconds: expiration,
        },
      },
      grantee,
      granter,
    }),
  };

  return [voteGrant, feeGrant];
};


