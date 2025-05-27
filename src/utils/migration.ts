import { CosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { AccountFeatureSet, FeatureKey } from "../types/migration";

export const accountFeatures: Record<string, AccountFeatureSet> = {
  d60581309eadf27a366f35eeffe364c40ce49f0bb4165a5ad03c1104983bf82f: {
    checksum:
      "d60581309eadf27a366f35eeffe364c40ce49f0bb4165a5ad03c1104983bf82f",
    features: new Set([FeatureKey.PASSKEY]),
    promotedFeatures: [
      {
        title: "Performance Improvements",
        description:
          "Improved utility and user experience for various operations.",
      },
    ],
  },
  "6fd7aa76aa9ed8e6f55d16093ee64611ccfb9743ac5a07b71ad4acb342af0ebf": {
    checksum:
      "6fd7aa76aa9ed8e6f55d16093ee64611ccfb9743ac5a07b71ad4acb342af0ebf",
    features: new Set([FeatureKey.PASSKEY]),
    promotedFeatures: [
      {
        title: "Performance Improvements",
        description:
          "Improved utility and user experience for various operations.",
      },
    ],
  },
  fc06f022c95172f54ad05bc07214f50572cdf684459eadd4f58a765524567db8: {
    checksum:
      "fc06f022c95172f54ad05bc07214f50572cdf684459eadd4f58a765524567db8",
    features: new Set([FeatureKey.PASSKEY]),
    promotedFeatures: [],
  },
  "2b762f3ac65381f39dff37e08f5a0ccd7ab0e6c72e33cf4636f2261136f329bc": {
    checksum:
      "2b762f3ac65381f39dff37e08f5a0ccd7ab0e6c72e33cf4636f2261136f329bc",
    features: new Set([FeatureKey.PASSKEY]),
    promotedFeatures: [],
  },
};

/**
 * Gets promoted features for migration based on target checksum
 */
export function getPromotedFeatures(targetChecksum: string) {
  const targetFeatures = accountFeatures[targetChecksum];
  if (!targetFeatures) return [];

  return targetFeatures.promotedFeatures;
}

/**
 * Fetches contract checksum for a given code ID
 */
export async function fetchContractChecksum(
  client: CosmWasmClient,
  codeId: number,
): Promise<string | null> {
  try {
    const codeDetails = await client.getCodeDetails(codeId);
    if (!codeDetails?.checksum) {
      throw new Error("Failed to get contract checksum");
    }
    return codeDetails.checksum;
  } catch (error) {
    console.error("Error fetching contract checksum:", error);
    return null;
  }
}
