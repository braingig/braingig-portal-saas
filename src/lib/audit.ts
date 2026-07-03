import { supabase } from "@/integrations/supabase/client";
import { getActiveOrgId } from "./org-context";

export async function logAudit(
  action: string,
  entityType: string,
  entityId?: string,
  metadata: Record<string, unknown> = {},
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("audit_logs").insert({
    organization_id: getActiveOrgId(),
    actor_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    metadata: metadata as never,
  });
}
