import { DetailCard } from "@/components/projects/details/detail-card";
import { stripHtml } from "@/lib/format";
import type { ProjectRecord } from "@/lib/projects/types";

type ProjectDetailsDescriptionProps = {
  project: ProjectRecord;
};

export function ProjectDetailsDescription({ project }: ProjectDetailsDescriptionProps) {
  const plain = stripHtml(project.description);
  const hasHtml = project.description && project.description !== plain;

  return (
    <DetailCard title="Description">
      {!plain && !hasHtml ? (
        <p className="text-sm leading-relaxed text-muted-foreground">No description provided.</p>
      ) : hasHtml ? (
        <div
          className="text-sm leading-relaxed text-foreground [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
          dangerouslySetInnerHTML={{ __html: project.description! }}
        />
      ) : (
        <p className="text-sm leading-relaxed text-foreground">{plain}</p>
      )}
    </DetailCard>
  );
}
