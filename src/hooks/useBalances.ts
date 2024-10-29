import { useQuery } from "@tanstack/react-query";
import { Coin } from "cosmjs-types/cosmos/base/v1beta1/coin";
import axios from "axios";
import { REST_API_URL, REST_ENDPOINTS, USDC_DENOM } from "../config";

const fetchBalances = async (address: string): Promise<Coin[]> => {
  // uncomment to test balances
  //   return [
  //     { amount: "10000000", denom: "uxion" },
  //     {
  //       amount: "30000000",
  //       denom:
  //         "ibc/57097251ED81A232CE3C9D899E7C8096D6D87EF84BA203E12E424AA4C9B57A64",
  //     },
  //     {
  //       amount: "60000000000000000000",
  //       denom:
  //         "ibc/05314A48723E06A1B1B666066B6BEC89F3708E8854DF2E5E9193387AA9653036",
  //     },
  //     {
  //       amount: "9000000",
  //       denom:
  //         "ibc/33517D439F5E545A1AAB148FAE43AAE17CF68FFB9BC97AE0048A3E3B64518C58",
  //     },
  //   ];

  try {
    const response = await axios.get(
      `${REST_API_URL}${REST_ENDPOINTS.balances}/${address}`,
    );
    if (response.status !== 200) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const balances = response.data.balances;

    // inject xion and usdc if not present
    if (!balances.some((balance: Coin) => balance.denom === "uxion")) {
      balances.push({ amount: "0", denom: "uxion" });
    }

    if (!balances.some((balance: Coin) => balance.denom === USDC_DENOM)) {
      balances.push({
        amount: "0",
        denom: USDC_DENOM,
      });
    }

    return balances;
  } catch (error) {
    console.error("Error fetching asset list:", error);
    throw error;
  }
};

/**
 * Hook to fetch and cache balance data for an address
 * @param address - The address to fetch balances for
 * @returns The balances and query info
 */
export const useBalances = (address: string) => {
  return useQuery({
    queryKey: ["balances", address],
    queryFn: () => fetchBalances(address),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};
