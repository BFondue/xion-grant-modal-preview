import React from "react";
import { PermissionDescription } from "../../types/treasury-types";
import { Accordion } from "../ui";
import { Skeleton } from "../ui/skeleton";

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
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const items = permissions.map((permission) => ({
    title: `"${permission.dappDescription}" - ${permission.authorizationDescription}`,
    icon: <EllipsisIcon />,
    expandable: permission.contracts?.length > 0,
    children:
      permission.contracts?.length > 0 ? (
        <ul className="ui-list-disc ui-space-y-0.5">
          {permission.contracts.map((contract, index) => (
            <li
              key={index}
              className="ui-break-words ui-text-primary-text"
              style={{
                overflowWrap: "anywhere",
              }}
            >
              {contract}
            </li>
          ))}
        </ul>
      ) : undefined,
  }));

  return <Accordion items={items} />;
};
