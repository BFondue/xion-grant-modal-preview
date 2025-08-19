import { useQuery } from "@tanstack/react-query";
import { getAuthenticatorTypes } from "../lib/auth-types";

export const useAuthTypes = (userIds: string[]) => {
  return useQuery({
    queryKey: ["auth-types", userIds],
    queryFn: () => getAuthenticatorTypes(userIds),
  });
};
