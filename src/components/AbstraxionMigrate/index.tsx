import React, { useContext, useState } from "react";
import { MsgMigrateContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { Uint53 } from "@cosmjs/math";
import { toUtf8 } from "@cosmjs/encoding";
import { Spinner, BaseButton } from "../ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../../hooks";
import { getEnvNumberOrThrow, getEnvStringOrThrow } from "../../utils";
import { validateFeeGrant } from "../../utils/validate-fee-grant";
import { assertIsDeliverTxSuccess } from "@cosmjs/stargate";
import { MigrationDialog } from "./MigrationDialog";

type AbstraxionMigrateProps = {
  currentCodeId: number;
  updateContractCodeID: (codeId: number) => void;
};

/*
 * This component will need to become more intelligent as we develop and deploy more account contracts.
 * */
const targetCodeId = getEnvNumberOrThrow(
  "VITE_DEFAULT_ACCOUNT_CONTRACT_CODE_ID",
  import.meta.env.VITE_DEFAULT_ACCOUNT_CONTRACT_CODE_ID,
);
export const AbstraxionMigrate = ({
  currentCodeId,
  updateContractCodeID,
}: AbstraxionMigrateProps) => {
  const { setAbstraxionError, chainInfo } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const { client, getGasCalculation } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const [inProgress, setInProgress] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't render the component if we're on testnet-2
  if (chainInfo?.chainId === "xion-testnet-2") return null;

  const migrateAccount = async () => {
    if (!client) return;
    try {
      setInProgress(true);

      const migrateMsg = {
        typeUrl: "/cosmwasm.wasm.v1.MsgMigrateContract",
        value: MsgMigrateContract.fromPartial({
          sender: account.id,
          contract: account.id,
          codeId: BigInt(new Uint53(targetCodeId).toString()),
          msg: toUtf8(
            JSON.stringify({
              code_id: targetCodeId,
            }),
          ),
        }),
      };

      // Check if fee grant exists
      const feeGranterAddress = getEnvStringOrThrow(
        "VITE_FEE_GRANTER_ADDRESS",
        import.meta.env.VITE_FEE_GRANTER_ADDRESS,
      );
      const isValidFeeGrant = await validateFeeGrant(
        chainInfo.rest,
        feeGranterAddress,
        account.id,
        [
          "/cosmos.authz.v1beta1.MsgGrant",
          "/cosmos.feegrant.v1beta1.MsgGrantAllowance",
          "/cosmwasm.wasm.v1.MsgExecuteContract",
          "/cosmwasm.wasm.v1.MsgMigrateContract",
        ],
        account.id,
      );

      const validFeeGranter = isValidFeeGrant ? feeGranterAddress : null;

      const simmedGas = await client.simulate(
        account.id,
        [migrateMsg],
        "",
        validFeeGranter,
      );
      const fee = getGasCalculation(simmedGas);

      const deliverTxRes = await client.signAndBroadcast(
        account.id,
        [migrateMsg],
        validFeeGranter ? { ...fee, granter: validFeeGranter } : fee,
      );

      assertIsDeliverTxSuccess(deliverTxRes);

      void updateContractCodeID(targetCodeId);
    } catch (error) {
      console.log("something went wrong: ", error);
      setAbstraxionError("Failed to migrate account.");
      setFailed(true);
    } finally {
      setInProgress(false);
      setDialogOpen(false);
    }
  };

  if (currentCodeId === targetCodeId) return null;

  if (failed) {
    return null;
  }

  if (inProgress) {
    return (
      <div className="ui-w-full ui-min-h-[100px] ui-flex ui-items-center ui-justify-center ui-text-white">
        <Spinner />
      </div>
    );
  }

  return (
    <>
      <div className="ui-w-full ui-rounded-xl ui-bg-transparent ui-border ui-border-dashed ui-border-white/20 ui-p-4 ui-flex ui-flex-col sm:ui-flex-row ui-gap-4 sm:ui-justify-between ui-items-center">
        <div>
          <h2 className="ui-text-xl ui-font-bold">Account Migration Available!</h2>
          <p className="ui-text-secondary-text ui-text-sm">New features and security improvements.</p>
        </div>
        <BaseButton 
          size="small"
          onClick={() => setDialogOpen(true)}
          className="ui-w-full sm:ui-w-auto"
        >
          LEARN MORE
        </BaseButton>
      </div>
      
      <MigrationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        currentCodeId={currentCodeId}
        targetCodeId={targetCodeId}
        onUpgrade={migrateAccount}
      />
    </>
  );
};
