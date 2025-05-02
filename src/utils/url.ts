export function getDomainAndProtocol(url: string | undefined): string {
  try {
    const u = new URL(url || "");
    return u.protocol + "//" + u.hostname;
  } catch {
    return (url || "").trim();
  }
}

export function urlsMatch(
  urlA: string | undefined,
  urlB: string | undefined,
): boolean {
  return getDomainAndProtocol(urlA) === getDomainAndProtocol(urlB);
}
