export interface MigrationFeature {
  title: string;
  description: string;
  codeId: number;
}

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
