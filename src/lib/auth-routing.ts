import { supabase } from "@/integrations/supabase/client";
import { clearActiveOrgId } from "@/lib/org-context";

export type PostAuthPath = "/platform" | "/dashboard" | "/onboarding";

/** Returns true when the user is a platform administrator (not tied to any agency workspace). */
export async function checkIsPlatformAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

/** Resolves where an authenticated user should land after sign-in. */
export async function resolvePostAuthPath(userId: string): Promise<PostAuthPath> {
  if (await checkIsPlatformAdmin(userId)) {
    clearActiveOrgId();
    return "/platform";
  }

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1);

  return memberships?.length ? "/dashboard" : "/onboarding";
}
