export { cn } from './classname-util';
export * from './jwt-decoder';
export * from './webauthn-utils';
export * from './authenticator-utils';
export * from './chain-utils';
export { basicFormatCurrency, basicFormatTokenAmount } from './formatters';

export function truncateAddress(
  address: string | undefined,
  frontLength: number = 8,
  backLength: number = 4,
) {
  if (!address) {
    return "";
  }
  return (
    address.slice(0, frontLength) +
    "..." +
    address.slice(address.length - backLength, address.length)
  );
}

export function getHumanReadablePubkey(pubkey: Uint8Array | undefined) {
  if (!pubkey) {
    return "";
  }
  const pubUint8Array = new Uint8Array(Object.values(pubkey));
  const pubBase64 = btoa(String.fromCharCode(...pubUint8Array));
  return pubBase64;
}

export function encodeHex(bytes: Buffer) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function getEnvNumberOrThrow(key: string, value?: string): number {
  const val = Number(value);
  if (isNaN(val)) {
    throw new Error(`Environment variable ${key} must be defined`);
  }

  return val;
}

export function getEnvStringOrThrow(key: string, value?: string): string {
  if (!value) {
    throw new Error(`Environment variable ${key} must be defined`);
  }

  return value;
}

export function removeTrailingDigits(number: number) {
  return number / 1000000;
}

export function getCommaSeperatedNumber(number: number) {
  const millionthPart = removeTrailingDigits(number);
  return millionthPart.toLocaleString("en-US", {
    minimumFractionDigits: Math.max(
      0,
      Math.ceil(
        Math.abs(millionthPart) < 1 ? Math.log10(Math.abs(millionthPart)) : 0,
      ),
    ),
    maximumFractionDigits: 6,
  });
}

export function formatBalance(
  number: number,
  locale: string = "en-US",
  currency: string = "USD",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
  })
    .format(number)
    .replace(currency, "")
    .trim();
}

export function isValidWalletAddress(address: string) {
  if (address.length !== 43 && address.length !== 63) {
    return false;
  }

  const validCharacters = /^[0-9a-zA-Z]+$/;
  if (!validCharacters.test(address)) {
    return false;
  }

  if (!address.startsWith("xion")) {
    return false;
  }

  return true;
}

export { chainId, isMainnet } from "./chain-utils";

export {
  formatIBCAddresses,
  IBC_ADDRESS_PATTERN,
} from "./format-ibc-addresses";
