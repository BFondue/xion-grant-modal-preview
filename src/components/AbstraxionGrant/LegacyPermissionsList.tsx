import React from "react";
import { ContractGrantDescription } from "./generateContractGrant";
import { Accordion } from "../ui";

interface LegacyPermissionsListProps {
  contracts: ContractGrantDescription[];
  bank: { denom: string; amount: string }[];
  stake: boolean;
}

const EllipsisIcon = () => (
  <span className="ui-text-white ui-text-lg ui-leading-none">•</span>
);

export const LegacyPermissionsList: React.FC<LegacyPermissionsListProps> = ({
  contracts,
  bank,
  stake,
}) => {
  const items = [
    ...(contracts && contracts.length >= 1
      ? [
          {
            title: "Permission to execute smart contracts",
            icon: <EllipsisIcon />,
            expandable: true,
            children: (
              <ul className="ui-list-disc ui-space-y-0.5 ui-pl-4">
                {contracts.map((contract, index) => (
                  <li
                    key={index}
                    className="ui-break-all ui-text-primary-text"
                    style={{
                      overflowWrap: "anywhere",
                    }}
                  >
                    {typeof contract === "string" ? contract : contract.address}
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
    ...(stake
      ? [
          {
            title: "Permission to manage staking operations",
            icon: <EllipsisIcon />,
            children: (
              <ul className="ui-list-disc ui-space-y-2 ui-pl-4">
                <li className="ui-text-primary-text">Stake Tokens</li>
                <li className="ui-text-primary-text">
                  Withdraw Staking Rewards
                </li>
                <li className="ui-text-primary-text">Manage Unbonding</li>
              </ul>
            ),
          },
        ]
      : []),
    ...(bank && bank.length >= 1
      ? [
          {
            title: (
              <>
                Permission to send tokens with a spend limit of{" "}
                {bank.map(({ denom, amount }, index) => (
                  <span key={index} className="ui-text-primary-text">
                    {`${amount} ${denom}`}
                    {index < bank.length - 1 ? ", " : ""}
                  </span>
                ))}
              </>
            ),
            icon: <EllipsisIcon />,
          },
        ]
      : []),
    {
      title: "Log you in to their app",
      icon: <EllipsisIcon />,
    },
  ];

  return <Accordion items={items} />;
};
