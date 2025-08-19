import React, { useMemo } from "react";
import { User } from "@stytch/vanilla-js";
import { Authenticator } from "../indexer-strategies/types";
import { useAuthTypes } from "../auth/hooks/useAuthTypes";
import { AuthenticatorItem } from "./AuthenticatorItem";
import { AuthenticatorsLoadingSkeleton } from "./AuthenticatorsLoadingSkeleton";
import { extractUserIdFromAuthenticator } from "../auth/utils/authenticator-helpers";

interface AuthenticatorsListProps {
  authenticators: Authenticator[];
  currentAuthenticatorIndex: number;
  isMainnet: boolean;
  onRemoveAuthenticator: (authenticator: Authenticator) => void;
  user: User | null;
}

export const AuthenticatorsList: React.FC<AuthenticatorsListProps> = ({
  authenticators,
  currentAuthenticatorIndex,
  isMainnet,
  onRemoveAuthenticator,
  user,
}) => {
  // Memoize userIds extraction to avoid recalculation on every render
  const userIds = useMemo(() => {
    return authenticators
      .map((authenticator) =>
        extractUserIdFromAuthenticator(
          authenticator.authenticator,
          authenticator.type,
        ),
      )
      .filter((userId): userId is string => userId !== null);
  }, [authenticators]);

  // Fetch auth types with error handling
  const { data: authTypes, error, isLoading } = useAuthTypes(userIds);

  // Create a map for efficient lookups
  const authTypesMap = useMemo(() => {
    if (!authTypes) return new Map<string, string>();

    return new Map(
      Object.entries(authTypes).map(([userId, types]) => [
        userId,
        types?.[0] || "",
      ]),
    );
  }, [authTypes]);

  // Sort authenticators to show active session first - MUST be before early returns
  const sortedAuthenticators = useMemo(() => {
    if (!authenticators || authenticators.length === 0) return [];

    return [...authenticators].sort((a, b) => {
      const aIsActive = a.authenticatorIndex === currentAuthenticatorIndex;
      const bIsActive = b.authenticatorIndex === currentAuthenticatorIndex;

      // If one is active and the other isn't, active comes first
      if (aIsActive && !bIsActive) return -1;
      if (!aIsActive && bIsActive) return 1;

      // If both are active or both are inactive, maintain original order
      return 0;
    });
  }, [authenticators, currentAuthenticatorIndex]);

  // Handle error state
  if (error) {
    console.error("Failed to fetch authenticator types:", error);
    // Continue rendering with fallback labels
  }

  // Handle empty state
  if (!authenticators || authenticators.length === 0) {
    return (
      <div className="ui-flex ui-items-center ui-justify-center ui-px-4 ui-py-8 ui-text-secondary-text">
        No authenticators configured
      </div>
    );
  }

  // Show skeleton while loading auth types for JWT authenticators
  // Only show skeleton if we have JWT authenticators that need type resolution
  const hasJwtAuthenticators = authenticators.some(
    (auth) => auth.type === "Jwt",
  );
  if (isLoading && hasJwtAuthenticators) {
    return <AuthenticatorsLoadingSkeleton />;
  }

  return (
    <div className="ui-flex ui-flex-col ui-gap-5">
      {sortedAuthenticators.map((authenticator) => {
        const userId = extractUserIdFromAuthenticator(
          authenticator.authenticator,
          authenticator.type,
        );
        const authType = userId ? authTypesMap.get(userId) : undefined;

        return (
          <AuthenticatorItem
            key={authenticator.id}
            authenticator={authenticator}
            currentAuthenticatorIndex={currentAuthenticatorIndex}
            isMainnet={isMainnet}
            onRemove={onRemoveAuthenticator}
            user={user}
            authType={authType}
          />
        );
      })}
    </div>
  );
};
