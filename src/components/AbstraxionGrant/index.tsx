import React, { useCallback, useContext, useEffect, useState } from "react";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate/build/stargateclient";
import { EncodeObject } from "@cosmjs/proto-signing";
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { BaseButton } from "../ui";
import {
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Skeleton } from "../ui/skeleton";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../../hooks";
import { generateBankGrant } from "./generateBankGrant";
import {
  ContractGrantDescription,
  generateContractGrant,
} from "./generateContractGrant";
import { generateStakeAndGovGrant } from "./generateStakeAndGovGrant";
import { getEnvStringOrThrow } from "../../utils";
import { useXionDisconnect } from "../../hooks/useXionDisconnect";
import { getGasCalculation } from "../../utils/gas-utils";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { PermissionsList } from "./PermissionsList";
import { LegacyPermissionsList } from "./LegacyPermissionsList";
import { Checkbox } from "../ui/checkbox";

import burntAvatar from "../../assets/burntAvatarCircle.png";
import { useQueryParams } from "../../hooks/useQueryParams";
import {
  PermissionDescription,
  TreasuryParams,
} from "../../types/treasury-types";
import { generateTreasuryGrants } from "../../utils/generate-treasury-grants";
import { isContractGrantConfigValid } from "../../utils/contract-grant-check";
import { validateFeeGrant } from "../../utils/validate-fee-grant";
import { queryTreasuryContract } from "../../utils/query-treasury-contract";
import { redirectToDapp } from "../../utils/redirect-utils";
import xionLogo from "../../assets/logo.png";
import SpinnerV2 from "../ui/icons/SpinnerV2";
import AnimatedCheckmark from "../ui/icons/AnimatedCheck";

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
  const { chainInfo, abstraxionError, setAbstraxionError } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const [inProgress, setInProgress] = useState(false);
  const [isTreasuryQueryLoading, setIsTreasuryQueryLoading] = useState(
    treasury ? true : false,
  );
  const [inCheckProgress, setInCheckProgress] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [permissions, setPermissions] = useState<PermissionDescription[]>([]);
  const [treasuryParams, setTreasuryParams] = useState<TreasuryParams>({
    display_url: "",
    redirect_url: "",
    icon_url: "",
  });
  const [urlMismatchConfirmed, setUrlMismatchConfirmed] = useState(false);
  const hasUrlMismatch =
    treasury && treasuryParams.redirect_url !== redirect_uri;

  useEffect(
    function redirectAfterSuccess() {
      if (showSuccess && (treasuryParams.redirect_url || redirect_uri)) {
        const redirectTimer = setTimeout(() => {
          redirectToDapp(account?.id, treasuryParams.redirect_url);
        }, 5000);

        return () => clearTimeout(redirectTimer);
      }
    },
    [showSuccess, redirect_uri, account?.id, treasuryParams.redirect_url],
  );

  const handleDeny = () => {
    if (treasuryParams.redirect_url || redirect_uri) {
      redirectToDapp(undefined, treasuryParams.redirect_url);
    } else {
      xionDisconnect();
    }
  };

  const grantTreasuryPermissions = async (
    granter: string,
    expiration: bigint,
    feeGranter?: string,
  ) => {
    const grantMsgs = await generateTreasuryGrants(
      treasury,
      client,
      granter,
      grantee,
    );

    const deployFeeGrantMsg = {
      deploy_fee_grant: {
        authz_granter: granter,
        authz_grantee: grantee,
      },
    };

    const batchedMsgs = [
      ...grantMsgs,
      {
        typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
        value: MsgExecuteContract.fromPartial({
          sender: account.id,
          contract: treasury,
          msg: new Uint8Array(Buffer.from(JSON.stringify(deployFeeGrantMsg))),
          funds: [],
        }),
      },
    ];

    const simmedGas = await client.simulate(
      account.id,
      batchedMsgs,
      `treasury-grant-${expiration}`,
      feeGranter,
    );

    const fee = getGasCalculation(simmedGas);

    const deliverTxResponse = await client.signAndBroadcast(
      account.id,
      batchedMsgs,
      feeGranter
        ? {
            ...fee,
            granter: feeGranter,
          }
        : fee,
    );

    assertIsDeliverTxSuccess({
      ...deliverTxResponse,
      gasUsed: BigInt(deliverTxResponse.gasUsed),
      gasWanted: BigInt(deliverTxResponse.gasWanted),
    });

    return;
  };

  const grantLegacyPermisssions = async (
    granter: string,
    expiration: bigint,
    feeGranter?: string,
  ) => {
    const msgs: EncodeObject[] = [];

    if (contracts.length > 0) {
      msgs.push(generateContractGrant(expiration, grantee, granter, contracts));
    }

    if (stake) {
      msgs.push(...generateStakeAndGovGrant(expiration, grantee, granter));
    }

    if (bank.length > 0) {
      msgs.push(generateBankGrant(expiration, grantee, granter, bank));
    }

    if (msgs.length === 0) {
      throw new Error("No grants to send");
    }

    const simmedGas = await client.simulate(
      account.id,
      msgs,
      `grant-${expiration}`,
      feeGranter,
    );

    const fee = getGasCalculation(simmedGas);

    const deliverTxResponse = await client.signAndBroadcast(
      account.id,
      msgs,
      feeGranter
        ? {
            ...fee,
            granter: feeGranter,
          }
        : fee,
    );

    assertIsDeliverTxSuccess(deliverTxResponse);
    return;
  };

  const grant = async () => {
    try {
      setInProgress(true);
      // Extra check for security
      if (abstraxionError) {
        throw new Error("There's been an error. Cannot continue.");
      }

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
            1000,
        ),
      );

      // Check if fee grant exists
      const feeGranterAddress = getEnvStringOrThrow(
        "VITE_FEE_GRANTER_ADDRESS",
        import.meta.env.VITE_FEE_GRANTER_ADDRESS,
      );
      const isValidFeeGrant = await validateFeeGrant(
        chainInfo.rest,
        feeGranterAddress,
        granter,
        [
          "/cosmos.authz.v1beta1.MsgGrant",
          "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
          "/cosmwasm.wasm.v1.MsgExecuteContract",
          "/cosmwasm.wasm.v1.MsgMigrateContract",
        ],
        account.id,
      );

      const validFeeGranter = isValidFeeGrant ? feeGranterAddress : null;

      if (treasury) {
        await grantTreasuryPermissions(
          granter,
          timestampThreeMonthsFromNow,
          validFeeGranter,
        );
      } else {
        await grantLegacyPermisssions(
          granter,
          timestampThreeMonthsFromNow,
          validFeeGranter,
        );
      }

      setShowSuccess(true);
    } catch (error) {
      console.log("something went wrong: ", error);
      setAbstraxionError(error.message);
    } finally {
      setInProgress(false);
    }
  };

  const query = useCallback(async () => {
    try {
      // Create a promise that resolves after minimum loading time (1000ms)
      const minimumLoadingTime = new Promise((resolve) =>
        setTimeout(resolve, 1000),
      );

      const [{ permissionDescriptions, params }] = await Promise.all([
        queryTreasuryContract(treasury, client, account.id),
        minimumLoadingTime,
      ]);

      setPermissions(permissionDescriptions);
      setTreasuryParams(params);
    } catch {
      setAbstraxionError(
        "Invalid contract grant configuration detected. Please reach out to the DAPP team to resolve this issue.",
      );
    } finally {
      setIsTreasuryQueryLoading(false);
    }
  }, [client, account?.id, treasury, setAbstraxionError]);

  useEffect(() => {
    if (client && treasury) {
      query();
    }
  }, [client, treasury, query]);

  useEffect(() => {
    const validateContracts = () => {
      setInCheckProgress(true);

      try {
        if (contracts.length > 0) {
          const isValid = isContractGrantConfigValid(contracts, account);

          if (!isValid) {
            setAbstraxionError(
              "Invalid contract grant configuration detected. Please reach out to the DAPP team to resolve this issue.",
            );
          }
        }
      } finally {
        setInCheckProgress(false);
      }
    };

    validateContracts();
  }, [contracts, account]);

  return (
    <div>
      {showSuccess ? (
        <>
          <DialogHeader>
            <DialogTitle>Login Successful!</DialogTitle>
            <DialogDescription className="ui-leading-[14px]">
              You will now be redirected to your application.
            </DialogDescription>
          </DialogHeader>
          <div className="ui-flex ui-items-center ui-justify-center ui-my-20">
            <AnimatedCheckmark />
          </div>
          <DialogFooter>
            <img
              src={xionLogo}
              alt="XION Logo"
              width="90"
              height="32"
              className="ui-mx-auto"
            />
          </DialogFooter>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle>3rd Party Requesting</DialogTitle>
            {isTreasuryQueryLoading ? (
              <div className="ui-mt-8 ui-flex ui-flex-col ui-items-center ui-justify-center ui-gap-4">
                <Skeleton className="ui-h-[70px] ui-w-[70px] ui-rounded-2xl" />
                <Skeleton className="ui-h-9 ui-w-32" />
              </div>
            ) : (
              <>
                {treasuryParams.icon_url || treasuryParams.redirect_url ? (
                  <div className="ui-mt-8 ui-flex ui-flex-col ui-items-center ui-justify-center ui-gap-4">
                    {treasuryParams.icon_url && (
                      <img
                        src={treasuryParams.icon_url}
                        alt="App Icon"
                        width={70}
                        height={70}
                        className="ui-rounded-2xl ui-w-[70px] ui-h-[70px] ui-object-cover"
                      />
                    )}
                    {treasuryParams.redirect_url && (
                      <div className="ui-text-white ui-font-bold ui-text-base ui-leading-[16px] ui-px-3 ui-py-2.5 ui-bg-[rgba(255,255,255,0.05)] ui-rounded-lg">
                        {treasuryParams.redirect_url}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ui-mb-10 ui-mt-6 ui-flex ui-items-center ui-justify-center">
                    <img src={burntAvatar} alt="Burnt Avatar" />
                  </div>
                )}
              </>
            )}
          </DialogHeader>

          {treasury ? (
            <div className="ui-py-8">
              <PermissionsList
                permissions={permissions}
                isLoading={isTreasuryQueryLoading}
              />
            </div>
          ) : (
            <>
              <h1 className="ui-text-base ui-font-bold ui-leading-[16px] ui-mb-3">
                A 3rd party would like:
              </h1>
              <div className="ui-mb-12">
                <LegacyPermissionsList
                  contracts={contracts}
                  bank={bank}
                  stake={stake}
                />
              </div>
            </>
          )}

          <DialogFooter>
            {hasUrlMismatch && !isTreasuryQueryLoading ? (
              <div className="ui-border ui-border-warning ui-rounded-lg ui-p-3">
                <p className="ui-text-warning ui-text-sm ui-leading-[16px] ui-mb-4">
                  The app url you are connecting to does not match the url on
                  the contract. This could be a scam.
                </p>
                <div className="ui-mb-4">
                  <Checkbox
                    variant="warning"
                    checked={urlMismatchConfirmed}
                    onChange={(e) => {
                      // Only allow changing if not in progress or if there's an error
                      if (!inProgress || abstraxionError) {
                        setUrlMismatchConfirmed(e.target.checked);
                      }
                    }}
                    disabled={inProgress && !abstraxionError}
                    label="Confirm you want to continue"
                  />
                </div>
                <BaseButton
                  className="ui-w-full"
                  disabled={
                    inProgress ||
                    !client ||
                    isTreasuryQueryLoading ||
                    inCheckProgress ||
                    !urlMismatchConfirmed
                  }
                  onClick={grant}
                >
                  {inProgress ? (
                    <SpinnerV2 size="sm" color="black" />
                  ) : (
                    "ACCEPT AND CONTINUE"
                  )}
                </BaseButton>
              </div>
            ) : (
              <>
                <p className="ui-text-warning ui-text-sm ui-leading-[16px]">
                  Please make sure the url is correct before accepting.
                </p>
                <BaseButton
                  className="ui-w-full"
                  disabled={
                    inProgress ||
                    !client ||
                    isTreasuryQueryLoading ||
                    inCheckProgress
                  }
                  onClick={grant}
                >
                  {inProgress ? (
                    <SpinnerV2 size="sm" color="black" />
                  ) : (
                    "ACCEPT AND CONTINUE"
                  )}
                </BaseButton>
              </>
            )}
            <BaseButton variant="destructive" onClick={handleDeny}>
              DENY ACCESS
            </BaseButton>
            <BaseButton variant="text" size="text" onClick={xionDisconnect}>
              SWITCH ACCOUNT
            </BaseButton>
          </DialogFooter>
        </>
      )}
    </div>
  );
};
