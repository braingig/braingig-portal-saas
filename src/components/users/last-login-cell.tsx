import { formatLastLoginParts } from "@/lib/format";

export function LastLoginCell({ at }: { at: string | null }) {
  const parts = formatLastLoginParts(at);
  if (!parts) {
    return <p className="text-[10px] text-muted-foreground">Never logged in</p>;
  }
  return (
    <div className="leading-tight">
      <p className="text-[10px] font-medium text-foreground">{parts.time}</p>
      <p className="text-[10px] text-muted-foreground">{parts.label}</p>
    </div>
  );
}
