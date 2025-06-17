import { Asset } from "@/types/assets";

export const IBC_ADDRESS_PATTERN = /ibc\/[A-F0-9]{64}/gi;

/**
 * Formats text by replacing IBC addresses with human-readable asset symbols
 * @param text - The text containing IBC addresses to format
 * @param getAssetByDenom - Function to retrieve asset information by denomination
 * @returns The formatted text with IBC addresses replaced
 */
export const formatIBCAddresses = (
  text: string,
  getAssetByDenom: (denom: string) => Asset | undefined,
): string => {
  let formattedText = text;

  const ibcMatches = text.matchAll(IBC_ADDRESS_PATTERN);

  for (const match of ibcMatches) {
    const ibcAddress = match[0];
    const asset = getAssetByDenom(ibcAddress);

    if (asset) {
      formattedText = formattedText.replace(ibcAddress, asset.symbol);
    } else {
      const hash = ibcAddress.substring(4);
      formattedText = formattedText.replace(
        ibcAddress,
        `ibc/${hash.substring(0, 4)}...${hash.substring(hash.length - 4)}`,
      );
    }
  }

  return formattedText;
};
