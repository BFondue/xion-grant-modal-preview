"use client";
import {useCallback, useContext, useEffect, useState} from "react";
import {assertIsDeliverTxSuccess, DeliverTxResponse,} from "@cosmjs/stargate/build/stargateclient";
import {StdFee} from "@cosmjs/stargate";
import {EncodeObject} from "@cosmjs/proto-signing";
import {Button, Spinner} from "@burnt-labs/ui";
import {CheckIcon} from "../Icons";
import {useAbstraxionAccount, useAbstraxionSigningClient} from "../../hooks";
import type {ContractGrantDescription} from "@burnt-labs/abstraxion";
import {generateBankGrant} from "../../components/AbstraxionGrant/generateBankGrant";
import {generateContractGrant} from "../../components/AbstraxionGrant/generateContractGrant";
import {generateStakeGrant} from "../../components/AbstraxionGrant/generateStakeGrant";
import {getEnvStringOrThrow} from "../../utils";
import {useXionDisconnect} from "../../hooks/useXionDisconnect";
import {getGasCalculation} from "../../utils/gas-utils";
import {AbstraxionContext, AbstraxionContextProps,} from "../AbstraxionContext";

import burntAvatar from "../../assets/burntAvatarCircle.png";
import {useQueryParams} from "../../hooks/useQueryParams";
import {PermissionDescription} from "../../types/treasury-types";
import {generateTreasuryGrants} from "../../utils/generate-treasury-grants";
import {queryTreasuryContract} from "../../utils/query-treasury-contract";

interface AbstraxionGrantProps {
  contracts: ContractGrantDescription[];
  grantee: string;
  stake: boolean;
  bank: { denom: string; amount: string }[];
  treasury?: string;
}

export const AbstraxionGrant = ({
  contracts,
  grantee,
  stake,
  bank,
  treasury,
}: AbstraxionGrantProps) => {
  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const { redirect_uri } = useQueryParams(["redirect_uri"]);
  const { xionDisconnect } = useXionDisconnect();
  const { chainInfo, setAbstraxionError } = useContext(AbstraxionContext) as AbstraxionContextProps;

  const [inProgress, setInProgress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [permissions, setPermissions] = useState<PermissionDescription[]>([]);

  useEffect(function redirectToDapp() {
    if (showSuccess && redirect_uri) {
      let redirectUri = new URLSearchParams(window.location.search).get(
        "redirect_uri"
      );
      let url: URL | null = null;
      if (redirectUri) {
        url = new URL(redirectUri);
        let params = new URLSearchParams(url.search);
        params.append("granted", "true");
        params.append("granter", account.id);
        url.search = params.toString();
        redirectUri = url.toString();
        window.location.href = redirectUri;
      }
    }
  });

  const grant = async () => {
    setInProgress(true);
    if (!client) {
      throw new Error("no client");
    }

    if (!account) {
      throw new Error("no account");
    }

    const granter = account.id;
    const timestampThreeMonthsFromNow = BigInt(
      Math.floor(
        new Date(new Date().setMonth(new Date().getMonth() + 3)).getTime() /
          1000
      )
    );

    if (treasury) {
      try {
        const grantMsgs = await generateTreasuryGrants(
          treasury,
          client,
          granter,
          grantee
        );

        const simmedGas = await client.simulate(
          account.id,
          grantMsgs,
          `treasury-grant-${timestampThreeMonthsFromNow}`
        );

        const fee = getGasCalculation(simmedGas, chainInfo.chainId);

        const deliverTxResponse = await client?.signAndBroadcast(
          account.id,
          grantMsgs,
          fee
        );

        assertIsDeliverTxSuccess({
          ...deliverTxResponse,
          gasUsed: BigInt(deliverTxResponse.gasUsed),
          gasWanted: BigInt(deliverTxResponse.gasWanted),
        });

        const deployFeeGrantMsg = {
          deploy_fee_grant: {
            authz_granter: granter,
            authz_grantee: grantee,
          },
        };

        const deployFeeGrantTx = await client.execute(
          account.id,
          treasury,
          deployFeeGrantMsg,
          {
            amount: [{ amount: "0", denom: "uxion" }],
            gas: "500000",
          }
        );

        setShowSuccess(true);
      } catch (error) {
        console.warn(error);
      } finally {
        setInProgress(false);
        return;
      }
    }

    const msgs: EncodeObject[] = [];

    if (contracts.length > 0) {
      msgs.push(
        generateContractGrant(
          timestampThreeMonthsFromNow,
          grantee,
          granter,
          contracts
        )
      );
    }

    if (stake) {
      msgs.push(
        ...generateStakeGrant(timestampThreeMonthsFromNow, grantee, granter)
      );
    }

    if (bank.length > 0) {
      msgs.push(
        generateBankGrant(timestampThreeMonthsFromNow, grantee, granter, bank)
      );
    }

    try {
      if (msgs.length === 0) {
        throw new Error("No grants to send");
      }

      let fee: StdFee;
      let deliverTxResponse: DeliverTxResponse;

      try {
        const simmedGas = await client.simulate(
          account.id,
          msgs,
          `grant-${timestampThreeMonthsFromNow}`
        );

        fee = getGasCalculation(simmedGas, chainInfo.chainId);

        // Attempt to sign and broadcast the transaction using the fee granter
        deliverTxResponse = await client.signAndBroadcast(account.id, msgs, {
          ...fee,
          granter: getEnvStringOrThrow(
            "VITE_FEE_GRANTER_ADDRESS",
            import.meta.env.VITE_FEE_GRANTER_ADDRESS
          ),
        });
      } catch (error) {
        // This account doesn't have the fee grant, trying without fee grant.
        deliverTxResponse = await client.signAndBroadcast(
          account.id,
          msgs,
          fee
        );

        // Assert that the transaction was successful
        assertIsDeliverTxSuccess(deliverTxResponse);
      }

      setShowSuccess(true);
      setInProgress(false);
    } catch (error) {
      setInProgress(false);
      console.log("something went wrong: ", error);
      setAbstraxionError(error.message);
    }
  };

  const query = useCallback(async () => {
    try {
      const permissionDescriptions = await queryTreasuryContract(
        treasury,
        client
      );

      setPermissions(permissionDescriptions);
    } catch (error) {
      console.warn(error);
    }
  }, [client, permissions]);

  useEffect(() => {
    if (client && treasury) {
      query();
    }
  }, [client]);

  if (inProgress) {
    return (
      <div className="ui-w-full ui-h-full ui-min-h-[500px] ui-flex ui-items-center ui-justify-center ui-text-white">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="ui-flex ui-font-akkuratLL ui-flex-col ui-justify-center sm:ui-min-w-[380px] ui-text-white">
      {showSuccess ? (
        <>
          <h1 className="ui-text-center ui-text-3xl ui-font-light ui-uppercase ui-text-white ui-mb-6">
            Your sign-in <br />
            was Successful!
          </h1>
          <p className="ui-text-center ui-text-base ui-font-normal ui-leading-normal ui-text-zinc-100 ui-opacity-50 ui-mb-6">
            Please switch back to the previous window to continue your
            experience.
          </p>
        </>
      ) : (
        <>
          <div className="ui-mb-10 ui-flex ui-items-center ui-justify-center">
            <img src={burntAvatar} alt="Burnt Avatar" />
          </div>
          <div className="mb-4">
            <h1 className="ui-text-base ui-font-bold ui-leading-tight">
              A 3rd party would like:
            </h1>
            <div className="ui-w-full ui-bg-white ui-opacity-20 ui-h-[1px] ui-mt-8" />
            <ul className="ui-my-8 ui-list-disc ui-list-none">
              {treasury ? (
                permissions.map((permission, i) => (
                  <li
                    className="ui-flex ui-items-baseline ui-text-sm ui-mb-4 ui-overflow-x-auto"
                    key={i}
                  >
                    <span className="ui-mr-2">
                      <CheckIcon color="white" />
                    </span>
                    "{permission.dappDescription}" -{" "}
                    {permission.authorizationDescription}
                  </li>
                ))
              ) : (
                <>
                  <li className="ui-flex ui-items-baseline ui-text-sm ui-mb-4">
                    <span className="ui-mr-2">
                      <CheckIcon color="white" />
                    </span>
                    Have access to your account
                  </li>
                  <li className="ui-flex ui-items-baseline ui-text-sm">
                    <span className="ui-mr-2">
                      <CheckIcon color="white" />
                    </span>
                    Log you in to their app
                  </li>
                </>
              )}
            </ul>
            <div className="ui-w-full ui-bg-white ui-opacity-20 ui-h-[1px] ui-mb-8" />
            <div className="ui-w-full ui-flex ui-flex-col ui-gap-4">
              <Button
                disabled={inProgress || !client}
                structure="base"
                fullWidth={true}
                onClick={grant}
              >
                Allow and Continue
              </Button>
              <Button structure="outlined" onClick={xionDisconnect}>
                Switch Account
              </Button>
              <Button structure="naked">Deny Access</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
