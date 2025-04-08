/**
 * Constructs and returns a redirect URL with the specified parameters
 * @param redirectUri - The base redirect URI to use
 * @param granterId - Optional ID of the granter to append to the URL
 * @returns The constructed redirect URL or null if the redirect URI is invalid
 */
export const constructRedirectUrl = (
  redirectUri: string | null,
  granterId?: string,
): string | null => {
  if (!redirectUri) return null;

  try {
    const url = new URL(redirectUri);
    const params = new URLSearchParams(url.search);

    if (granterId) {
      params.append("granted", "true");
      params.append("granter", granterId);
    }

    url.search = params.toString();
    return url.toString();
  } catch {
    return null;
  }
};

/**
 * Redirects to the dapp with the specified parameters
 * @param redirectUri - The redirect URI to use
 * @param granterId - Optional ID of the granter to append to the URL
 * @returns true if redirect was successful, false otherwise
 */
export const redirectToDapp = (
  redirectUri: string,
  granterId?: string,
): boolean => {
  const redirectUrl = constructRedirectUrl(redirectUri, granterId);

  if (redirectUrl) {
    window.location.href = redirectUrl;
    return true;
  }
  return false;
};
