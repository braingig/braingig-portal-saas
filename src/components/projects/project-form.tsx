import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormSection } from "@/components/ui/form-field";
import { ProjectAttachmentsField } from "@/components/projects/project-attachments-field";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PROJECT_STATUSES, type ProjectFormValues, type ProjectStatus } from "@/lib/projects/constants";
import { cn } from "@/lib/utils";

const fieldClass = "bg-surface border-border focus-visible:ring-brand/30";

type ProjectFormProps = {
  values: ProjectFormValues;
  onChange: (values: ProjectFormValues) => void;
  newFiles: File[];
  onNewFilesChange: (files: File[]) => void;
  orgId: string;
  projectId?: string;
  idPrefix?: string;
};

export function ProjectForm({
  values,
  onChange,
  newFiles,
  onNewFilesChange,
  orgId,
  projectId,
  idPrefix = "project",
}: ProjectFormProps) {
  function patch(partial: Partial<ProjectFormValues>) {
    onChange({ ...values, ...partial });
  }

  return (
    <div className="space-y-6">
      <FormSection title="">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Project name" htmlFor={`${idPrefix}-name`} required>
            <Input
              id={`${idPrefix}-name`}
              required
              placeholder="Project Name"
              value={values.name}
              onChange={(e) => patch({ name: e.target.value })}
              className={fieldClass}
            />
          </FormField>

          <FormField label="Status" required>
            <Select
              value={values.status}
              onValueChange={(v) => patch({ status: v as ProjectStatus })}
            >
              <SelectTrigger className={cn(fieldClass, "w-full")}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <FormField label="Client name" htmlFor={`${idPrefix}-client`}>
          <Input
            id={`${idPrefix}-client`}
            placeholder="Client or company name"
            value={values.client}
            onChange={(e) => patch({ client: e.target.value })}
            className={fieldClass}
          />
        </FormField>
      </FormSection>

      <FormSection title="Budget & timeline">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Budget ($)" htmlFor={`${idPrefix}-budget`}>
            <Input
              id={`${idPrefix}-budget`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={values.budget}
              onChange={(e) => patch({ budget: e.target.value })}
              className={fieldClass}
            />
          </FormField>

          <FormField label="Hourly rate ($)" htmlFor={`${idPrefix}-hourly-rate`}>
            <Input
              id={`${idPrefix}-hourly-rate`}
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={values.hourlyRate}
              onChange={(e) => patch({ hourlyRate: e.target.value })}
              className={fieldClass}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Start date" htmlFor={`${idPrefix}-start-date`}>
            <Input
              id={`${idPrefix}-start-date`}
              type="date"
              value={values.startDate}
              onChange={(e) => patch({ startDate: e.target.value })}
              className={fieldClass}
            />
          </FormField>

          <FormField label="End date" htmlFor={`${idPrefix}-end-date`}>
            <Input
              id={`${idPrefix}-end-date`}
              type="date"
              value={values.endDate}
              onChange={(e) => patch({ endDate: e.target.value })}
              className={fieldClass}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Details">
        <FormField label="Description" required>
          <RichTextEditor
            value={values.description}
            onChange={(description) => patch({ description })}
            placeholder="Describe the project scope, goals, and deliverables…"
            minHeight="140px"
          />
        </FormField>

        <ProjectAttachmentsField
          idPrefix={idPrefix}
          orgId={orgId}
          projectId={projectId}
          newFiles={newFiles}
          onNewFilesChange={onNewFilesChange}
        />

        <FormField label="Note">
          <RichTextEditor
            value={values.note}
            onChange={(note) => patch({ note })}
            placeholder="Internal notes (optional)…"
            minHeight="100px"
          />
        </FormField>
      </FormSection>
    </div>
  );
}
