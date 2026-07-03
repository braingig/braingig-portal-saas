import type { ReactNode } from "react";

type TaskDetailsLayoutProps = {
  header: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
};

export function TaskDetailsLayout({ header, main, sidebar }: TaskDetailsLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      {header}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-4">{main}</div>
        <div className="min-w-0 space-y-4">{sidebar}</div>
      </div>
    </div>
  );
}
