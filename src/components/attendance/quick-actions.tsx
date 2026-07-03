import { BarChart3, ChevronRight, Settings2 } from "lucide-react";
import { AttendanceSectionHeader } from "@/components/attendance/today-summary";
import { COMPACT_CARD, SECONDARY_TEXT } from "@/components/attendance/attendance-styles";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
};

type Props = {
  onGenerateReport: () => void;
  onManageShifts?: () => void;
  showShifts?: boolean;
};

export function QuickActions({ onGenerateReport, onManageShifts, showShifts }: Props) {
  const actions: Action[] = [
    {
      id: "reports",
      title: "Attendance Reports",
      description: "Generate attendance reports",
      icon: <BarChart3 className="size-4 text-brand" />,
      onClick: onGenerateReport,
    },
  ];

  if (showShifts && onManageShifts) {
    actions.push({
      id: "shifts",
      title: "Shift Management",
      description: "Manage shifts and assignments",
      icon: <Settings2 className="size-4 text-brand" />,
      onClick: onManageShifts,
    });
  }

  return (
    <section>
      <AttendanceSectionHeader title="Quick Actions" />
      <div className="grid gap-1.5 sm:grid-cols-2">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={action.onClick}
            className={cn(
              COMPACT_CARD,
              "group flex w-full cursor-pointer items-center gap-3 py-2.5 text-left transition-colors",
              "hover:border-brand/30 hover:bg-brand/[0.03]",
            )}
          >
            <div className="rounded-md bg-brand/10 p-1.5 transition-colors group-hover:bg-brand/15">
              {action.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{action.title}</p>
              <p className={SECONDARY_TEXT}>{action.description}</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
          </button>
        ))}
      </div>
    </section>
  );
}
