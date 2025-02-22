/* eslint-disable */
// import { ContractGrantDescription } from "./AbstraxionGrant/generateContractGrant";
// import { LegacyPermissionsList } from "./AbstraxionGrant/LegacyPermissionsList";
// import { PermissionsList } from "./AbstraxionGrant/PermissionsList";
import { CopyAddress } from "./CopyAddress";
import OtpForm from "./OtpForm";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  Spinner,
  WalletIcon,
} from "./ui";
// import { BaseButton } from "./ui/buttons/baseButton";
// import { WalletActionButton } from "./ui/buttons/walletActionButton";
// import { ChevronRightIcon } from "./ui/icons/ChevronRight";
// import SpinnerV2 from "./ui/icons/SpinnerV2";

// export interface PermissionDescription {
//   authorizationDescription: string;
//   dappDescription?: string;
//   contracts?: string[];
// }

// interface LegacyPermissionsListProps {
//   contracts: ContractGrantDescription[];
//   bank: { denom: string; amount: string }[];
//   stake: boolean;
// }

const PracticeArea = () => {
  // const permissions: PermissionDescription[] = [
  //   {
  //     authorizationDescription: "Permission to execute smart contracts",
  //     dappDescription: "Dapp 1",
  //     contracts: ["0x12345678901234567890123456789012345678900x12345678901234567890123456789012345678900x1234567890123456789012345678901234567890"],
  //   },
  //   {
  //     authorizationDescription: "Permission to send tokens",
  //     dappDescription: "Dapp 2",
  //     contracts: ["0x1234567890123456789012345678901234567890", "0x1234567890123456789012345678901234567890", "0x1234567890123456789012345678901234567890"],
  //   },
  // ];

  // const legacyContracts: ContractGrantDescription[] = permissions.map((permission) => ({
  //   address: permission.contracts?.[0] || "",
  //   amounts: [],
  // }));

  const legacyBank: { denom: string; amount: string }[] = [
    {
      denom: "0x1234567890123456789012345678901234567890",
      amount: "100",
    },
    {
      denom: "0x1234567890123456789012345678901234567890",
      amount: "100",
    },
  ];
  const legacyStake: boolean = false;

  return (
    <div className="ui-flex ui-flex-col ui-gap-4">
      <h1>Practice Area</h1>

      {/* <div className="ui-flex ui-gap-4 ui-items-stretch ui-w-full">
        <WalletActionButton type="receive" />
        <WalletActionButton type="send" />
      </div> */}

      {/* <div className="ui-flex ui-gap-12 ui-items-center ui-my-10">
        <SpinnerV2 size="sm" />
        <SpinnerV2 size="md" />
        <SpinnerV2 size="lg" />
      </div> */}

      {/* <LegacyPermissionsList
        contracts={legacyContracts}
        bank={legacyBank}
        stake={legacyStake}
      /> */}

      {/* <OtpForm
        handleOtp={() => {}}
        handleResendCode={() => {}}
        error={""}
        setError={() => {}}
      /> */}

      {/* <Dialog>
        <DialogTrigger>
          Open Dialog
        </DialogTrigger>
        <DialogContent>
          <PermissionsList permissions={permissions} />
        </DialogContent>
      </Dialog> */}
    </div>
  );
};

export default PracticeArea;
