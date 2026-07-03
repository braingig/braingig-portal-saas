import { useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type Message = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: { full_name: string; avatar_url: string | null };
};

async function getOrCreateGeneralChannel(orgId: string, userId: string) {
  const { data: existing } = await supabase
    .from("channels")
    .select("id")
    .eq("organization_id", orgId)
    .eq("name", "general")
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("channels")
    .insert({
      name: "general",
      description: "Team-wide chat",
      organization_id: orgId,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export function GlobalChat() {
  const { user } = useAuth();
  const { orgId } = useOrganization();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [channelId, setChannelId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user || !orgId) return;

    let alive = true;

    const load = async () => {
      try {
        const chId = await getOrCreateGeneralChannel(orgId, user.id);
        if (!alive) return;
        setChannelId(chId);

        const { data, error } = await supabase
          .from("messages")
          .select("id, content, created_at, user_id, profiles(full_name, avatar_url)")
          .eq("channel_id", chId)
          .eq("organization_id", orgId)
          .order("created_at", { ascending: true })
          .limit(50);

        if (error) throw error;
        if (alive && data) setMessages(data as Message[]);
      } catch (err: any) {
        console.error(err);
        toast.error("Could not load team chat: " + err.message);
      }
    };

    load();

    const ch = supabase.channel(`global_chat_${orgId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => load())
      .subscribe();

    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [open, user, orgId]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !orgId || !channelId) return;

    const content = input.trim();
    setInput("");
    setLoading(true);

    const tempMsg: Message = {
      id: "temp-" + Date.now(),
      content,
      created_at: new Date().toISOString(),
      user_id: user.id,
      profiles: { full_name: "You", avatar_url: null },
    };
    setMessages(prev => [...prev, tempMsg]);

    const { error } = await supabase.from("messages").insert({
      organization_id: orgId,
      user_id: user.id,
      content,
      channel_id: channelId,
    });

    if (error) {
      toast.error(error.message);
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id));
    }

    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="grid place-items-center size-9 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground transition-colors relative">
          <MessageSquare className="size-4" />
          <span className="sr-only">Open chat</span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col p-0 border-l border-border bg-background">
        <SheetHeader className="px-6 py-4 border-b border-border bg-surface/50">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="size-5 text-brand" />
            Team Chat
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              No messages yet. Say hi to your team!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              return (
                <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? "self-end items-end" : "self-start items-start"}`}>
                  <span className="text-[10px] text-muted-foreground mb-1 ml-1">{isMe ? "You" : msg.profiles?.full_name || "Member"}</span>
                  <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? "bg-brand text-brand-foreground rounded-br-sm" : "bg-surface-2 text-foreground rounded-bl-sm border border-border"}`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-border bg-surface/50 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 h-10 rounded-full border border-border bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            disabled={loading || !channelId}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading || !channelId}
            className="size-10 rounded-full bg-brand text-brand-foreground flex items-center justify-center hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition-all"
          >
            <Send className="size-4 shrink-0 -ml-0.5" />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
