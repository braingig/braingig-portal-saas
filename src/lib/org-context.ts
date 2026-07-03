const STORAGE_KEY = "workpilot:active_org";

export function getActiveOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setActiveOrgId(orgId: string) {
  localStorage.setItem(STORAGE_KEY, orgId);
  window.dispatchEvent(new CustomEvent("workpilot:org-changed", { detail: orgId }));
}

export function clearActiveOrgId() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("workpilot:org-changed", { detail: null }));
}
