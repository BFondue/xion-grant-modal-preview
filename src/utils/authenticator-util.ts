// import { base64url, decodeJwt } from "jose";
import { Authenticator } from "../indexer-strategies/types";

// interface JwtPayload {
//   iat?: number;
//   iss?: string;
//   aud?: string | string[];
//   exp?: number;
//   nbf?: number;
//   jti?: string;
//   sub?: string;
//   transaction_hash?: string;
// }

/**
 * Returns the lowest missing or next index
 *
 * @returns {number} - Returns the lowest missing or next index.
 * @throws {Error} - If authenticators array is null or undefined.
 */
export function findLowestMissingOrNextIndex(
  authenticators?: Authenticator[],
): number {
  if (!authenticators) {
    throw new Error("Missing authenticators");
  }

  const indexSet = new Set(
    authenticators.map((authenticator) => authenticator.authenticatorIndex),
  );

  for (let i = 0; i <= indexSet.size; i++) {
    if (!indexSet.has(i)) {
      return i;
    }
  }

  return indexSet.size;
}

// export async function wrapJWt(session_jwt: string) {
//   const payload = decodeJwt(session_jwt) as JwtPayload;
//   const header = { alg: "RS256", typ: "JWT" };
//   const encodedHeader = base64url.encode(JSON.stringify(header));
//   const encodedPayload = base64url.encode(
//     JSON.stringify({
//       iat: payload.iat,
//       iss: payload.iss,
//       aud: payload.aud,
//       exp: payload.exp,
//       nbf: payload.nbf,
//       jti: payload.jti,
//       sub: payload.sub,
//       transaction_hash: payload.transaction_hash,
//     }),
//   );

//   const message = `${encodedHeader}.${encodedPayload}`;
//   const messageBytes = new TextEncoder().encode(message);
//   const signatureBytes = await Sign(messageBytes);
//   const base64Signature = base64url.encode(signatureBytes);

//   return `${encodedHeader}.${encodedPayload}.${base64Signature}`;
// }
