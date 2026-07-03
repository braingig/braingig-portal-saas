import type { ProjectFormValues } from "./constants";
import type { ProjectRecord } from "./types";

export function projectToFormValues(project: ProjectRecord): ProjectFormValues {
  return {
    name: project.name,
    budget: project.budget != null ? String(project.budget) : "",
    hourlyRate: project.hourly_rate != null ? String(project.hourly_rate) : "",
    status: (project.status as ProjectFormValues["status"]) || "planning",
    client: project.client ?? "",
    startDate: project.start_date?.slice(0, 10) ?? "",
    endDate: (project.end_date ?? project.due_date)?.slice(0, 10) ?? "",
    description: project.description ?? "",
    note: project.note ?? "",
  };
}
