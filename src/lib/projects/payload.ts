import type { ProjectFormValues } from "./constants";

export type ProjectPayload = {
  name: string;
  client: string | null;
  budget: number | null;
  status: string;
  due_date: string | null;
  hourly_rate?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string;
  note?: string | null;
};

export function buildBasePayload(values: ProjectFormValues): ProjectPayload {
  return {
    name: values.name.trim(),
    client: values.client.trim() || null,
    budget: values.budget ? parseFloat(values.budget) : null,
    status: values.status,
    due_date: values.endDate || values.startDate || null,
  };
}

export function buildExtendedPayload(values: ProjectFormValues): ProjectPayload {
  return {
    ...buildBasePayload(values),
    hourly_rate: values.hourlyRate ? parseFloat(values.hourlyRate) : null,
    start_date: values.startDate || null,
    end_date: values.endDate || null,
    description: values.description,
    note: values.note || null,
  };
}
