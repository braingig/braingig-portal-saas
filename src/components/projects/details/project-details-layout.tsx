import type { ReactNode } from "react";

type ProjectDetailsLayoutProps = {
  header: ReactNode;
  main: ReactNode;
  sidebar: ReactNode;
};

export function ProjectDetailsLayout({ header, main, sidebar }: ProjectDetailsLayoutProps) {
  return (
    <div className="mx-auto max-w-6xl pb-10">
      <div className="space-y-8">
        {header}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">{main}</div>
          <aside className="min-w-0 space-y-5 lg:sticky lg:top-6 lg:self-start">{sidebar}</aside>
        </div>
      </div>
    </div>
  );
}
