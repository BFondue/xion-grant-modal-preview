import React, { useContext, useState } from "react";
import { MsgMigrateContract } from "cosmjs-types/cosmwasm/wasm/v1/tx";
import { Uint53 } from "@cosmjs/math";
import { toUtf8 } from "@cosmjs/encoding";
import { Button, Spinner } from "../ui";
import {
  AbstraxionContext,
  AbstraxionContextProps,
} from "../AbstraxionContext";
import { useAbstraxionAccount, useAbstraxionSigningClient } from "../../hooks";
import { getGasCalculation } from "../../utils/gas-utils";

type AbstraxionMigrateProps = {
  currentCodeId: number;
  updateContractCodeID: (codeId: number) => void;
};

/*
 * This component will need to become more intelligent as we develop and deploy more account contracts.
 * */
const targetCodeId = 793;
export const AbstraxionMigrate = ({
  currentCodeId,
  updateContractCodeID,
}: AbstraxionMigrateProps) => {
  const { setAbstraxionError, chainInfo } = useContext(
    AbstraxionContext,
  ) as AbstraxionContextProps;

  const { client } = useAbstraxionSigningClient();
  const { data: account } = useAbstraxionAccount();
  const [inProgress, setInProgress] = useState(false);
  const [failed, setFailed] = useState(false);

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
          msg: toUtf8(JSON.stringify({})),
        }),
      };

      const simmedGas = await client.simulate(account.id, [migrateMsg], "");

      const fee = getGasCalculation(simmedGas, chainInfo.chainId);
      await client.signAndBroadcast(account.id, [migrateMsg], fee);

      void updateContractCodeID(targetCodeId);
    } catch (error) {
      console.log("something went wrong: ", error);
      setAbstraxionError("Failed to migrate account.");
      setFailed(true);
    } finally {
      setInProgress(false);
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
    <div className="ui-flexui-w-full ui-flex-col ui-items-start ui-justify-between ui-gap-8 sm:ui-p-10 ui-text-white">
      <div className="ui-flex ui-flex-col ui-gap-y-5 ui-w-full ui-text-center">
        <h1 className="ui-text-3xl ui-font-thin ui-uppercase ui-tracking-tighter ui-text-white ui-text-center">
          Congratulations!
        </h1>
        <p className="ui-tracking-tight ui-text-zinc-400 ui-text-center">
          Your account is due for an upgrade! Please click below to begin the
          process.
        </p>
        <div className="ui-w-full ui-flex ui-flex-col ui-gap-4">
          <Button structure="base" fullWidth={true} onClick={migrateAccount}>
            Upgrade Account
          </Button>
        </div>
      </div>
    </div>
  );
};
