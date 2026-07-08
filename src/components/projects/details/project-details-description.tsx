import { DetailCard } from "@/components/projects/details/detail-card";
import { ExpandableDetailText } from "@/components/projects/details/expandable-detail-text";
import type { ProjectRecord } from "@/lib/projects/types";

type ProjectDetailsDescriptionProps = {
  project: ProjectRecord;
};

export function ProjectDetailsDescription({ project }: ProjectDetailsDescriptionProps) {
  return (
    <DetailCard title="Description" variant="plain">
      <ExpandableDetailText
        html={project.description}
        emptyMessage="No description provided."
      />
    </DetailCard>
  );
}
