import React, { useMemo } from "react";
import { PermissionDescription } from "../../types/treasury-types";
import { Accordion } from "../ui";
import { Skeleton } from "../ui/skeleton";
import { useAssetList } from "../../hooks/useAssetList";
import { formatIBCAddresses } from "../../utils/format-ibc-addresses";

interface PermissionsListProps {
  permissions: PermissionDescription[];
  isLoading?: boolean;
}

const EllipsisIcon = () => (
  <span className="ui-text-white ui-text-lg ui-leading-none">•</span>
);

const LoadingSkeleton = () => (
  <div className="ui-space-y-4 ui-p-6 ui-bg-black/50 ui-rounded-lg">
    {[1, 2].map((i) => (
      <div key={i} className="ui-space-y-2">
        <Skeleton className="ui-h-6 ui-w-full" />
        <Skeleton className="ui-h-4 ui-w-3/4" />
      </div>
    ))}
  </div>
);

export const PermissionsList: React.FC<PermissionsListProps> = ({
  permissions,
  isLoading = false,
}) => {
  const { data: assetData, isLoading: isLoadingAssets } =
    useAssetList();

  const { getAssetByDenom } = assetData || { getAssetByDenom: () => undefined };

  const items = useMemo(
    () =>
      permissions.map((permission) => {
        const formattedTitle = formatIBCAddresses(
          permission.authorizationDescription,
          getAssetByDenom,
        );

        return {
          title: `"${permission.dappDescription}" - ${formattedTitle}`,
          icon: <EllipsisIcon />,
          expandable: permission.contracts && permission.contracts.length > 0,
          children:
            permission.contracts && permission.contracts.length > 0 ? (
              <ul className="ui-list-disc ui-space-y-0.5">
                {permission.contracts.map((contract, index) => {
                  const formattedContract = formatIBCAddresses(
                    contract,
                    getAssetByDenom,
                  );

                  return (
                    <li
                      key={index}
                      className="ui-break-words ui-text-primary-text"
                      style={{
                        overflowWrap: "anywhere",
                      }}
                    >
                      {formattedContract}
                    </li>
                  );
                })}
              </ul>
            ) : undefined,
        };
      }),
    [permissions, getAssetByDenom],
  );

  if (isLoading || isLoadingAssets || !assetData) {
    return <LoadingSkeleton />;
  }

  return <Accordion items={items} />;
};
