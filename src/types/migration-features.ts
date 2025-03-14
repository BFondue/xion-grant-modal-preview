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

export const accountFeatures: Record<number, AccountFeatureSet> = {
  21: {
    codeId: 21,
    features: new Set([FeatureKey.PASSKEY]),
    promotedFeatures: [
      {
        title: "Performance Improvements",
        description:
          "Improved utility and user experience for various operations.",
      },
    ],
  },
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

/**
 * Gets the migration features when upgrading from one code ID to another
 * @param targetCodeId The target contract code ID to migrate to
 * @returns Array of promoted features for the migration
 */
export function getPromotedFeatures(targetCodeId: number): PromotedFeature[] {
  const targetFeatures = getContractFeatures(targetCodeId);
  if (!targetFeatures) return [];

  return targetFeatures.promotedFeatures;
}
