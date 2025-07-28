// Export chainId and isMainnet function to break circular dependency
export const chainId = import.meta.env.VITE_CHAIN_ID;

export function isMainnet() {
  if (!chainId) {
    console.error("VITE_CHAIN_ID is undefined");
    return false;
  }
  return !chainId.includes("testnet");
}
