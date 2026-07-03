import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { getActiveOrgId } from "@/lib/org-context";
import { Link } from "@tanstack/react-router";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [items, setItems] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    let alive = true;

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const load = () => {
      const activeOrg = orgId ?? getActiveOrgId();
      let q = supabase.from("notifications").select("*").eq("user_id", user.id);
      if (activeOrg) q = q.eq("organization_id", activeOrg);
      q.order("created_at", { ascending: false }).limit(15)
        .then(({ data }) => { if (alive) setItems((data ?? []) as Notif[]); });
    };
    load();
    const ch = supabase.channel("notif:" + user.id)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotif = payload.new as Notif;
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification(newNotif.title, { body: newNotif.body || undefined });
            }
          }
          load();
        })
      .subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, [user, orgId]);

  const unread = items.filter((i) => !i.read_at).length;

  async function markAll() {
    if (!user) return;
    await supabase.from("notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id).is("read_at", null);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="grid place-items-center size-9 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors relative"
      >
        <Bell className="size-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-brand text-[9px] font-bold text-brand-foreground grid place-items-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-[360px] max-h-[480px] flex flex-col rounded-xl border border-border bg-popover shadow-2xl z-30 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && (
                <button onClick={markAll} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                  <Check className="size-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No notifications yet
                </div>
              ) : items.map((n) => (
                <NotifRow key={n.id} n={n} onClick={() => setOpen(false)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NotifRow({ n, onClick }: { n: Notif; onClick: () => void }) {
  const inner = (
    <div className={`px-4 py-3 border-b border-border last:border-0 hover:bg-surface-2 cursor-pointer flex gap-3 ${!n.read_at ? "bg-brand/[0.04]" : ""}`}>
      <span className={`mt-1.5 size-1.5 rounded-full shrink-0 ${!n.read_at ? "bg-brand" : "bg-transparent"}`} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{n.title}</p>
        {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.created_at)} ago</p>
      </div>
    </div>
  );
  return n.link
    ? <Link to={n.link} onClick={onClick}>{inner}</Link>
    : <div onClick={onClick} className="cursor-pointer">{inner}</div>;
}
