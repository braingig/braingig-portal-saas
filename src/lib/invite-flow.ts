export type InviteSearch = {
  token?: string;
};

export function parseInviteSearch(search: Record<string, unknown>): InviteSearch {
  const token = typeof search.token === "string" ? search.token.trim() : "";
  return token ? { token } : {};
}

export function inviteTokenFromSearch(search: InviteSearch | undefined): string {
  return search?.token?.trim() ?? "";
}
