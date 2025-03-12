export enum FeatureKey {
  PASSKEY = "passkey",
}

interface PromotedFeature {
  title: string;
  description: string;
}

interface AccountFeatureSet {
  codeId: number;
  features: Set<FeatureKey>;
  promotedFeatures: PromotedFeature[];
}



// Export for use in other files
export const accountFeatures: Record<number, AccountFeatureSet> = {
  21: {
    codeId: 21,
    features: new Set([FeatureKey.PASSKEY]),
    promotedFeatures: [
      {
        title: "Smart Contract Integration",
        description: "Seamless interaction with a wider range of smart contracts."
      },
      {
        title: "Enhanced Security",
        description: "Advanced security features to protect your assets."
      }
    ]
  }
};

function getContractFeatures(codeId: number): AccountFeatureSet | undefined {
  return accountFeatures[codeId];
}

/**
 * Checks if a specific feature is enabled for a contract code ID
 * @param codeId The contract code ID to check
 * @param feature The feature to check for
 * @returns True if the feature is enabled, false otherwise
 */
export function hasFeature(codeId: number, feature: FeatureKey): boolean {
  const featureSet = getContractFeatures(codeId);
  if (!featureSet) return false;
  return featureSet.features.has(feature);
}
