import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, FormSection } from "@/components/ui/form-field";
import { FileUpload } from "@/components/ui/file-upload";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { TaskAssigneesField } from "@/components/tasks/task-assignees-field";
import { TASK_PRIORITIES, type TaskFormValues, type TaskPriority } from "@/lib/tasks/constants";
import type { TaskMilestone, TaskOrgMember, TaskProjectOption } from "@/lib/tasks/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const fieldClass = "bg-surface border-border focus-visible:ring-brand/30";
const NONE = "__none__";

type TaskFormProps = {
  values: TaskFormValues;
  onChange: (values: TaskFormValues) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  orgId: string;
  projects: TaskProjectOption[];
  members: TaskOrgMember[];
  mentionMembers?: TaskOrgMember[];
  isSubtask?: boolean;
  idPrefix?: string;
};

export function TaskForm({
  values,
  onChange,
  files,
  onFilesChange,
  orgId,
  projects,
  members,
  mentionMembers,
  isSubtask = false,
  idPrefix = "task",
}: TaskFormProps) {
  const mentions = mentionMembers ?? members;
  const [milestones, setMilestones] = useState<TaskMilestone[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  function patch(partial: Partial<TaskFormValues>) {
    onChange({ ...values, ...partial });
  }

  useEffect(() => {
    if (!values.projectId || !orgId) {
      setMilestones([]);
      return;
    }

    setLoadingFolders(true);
    supabase
      .from("milestones")
      .select("id, title, project_id")
      .eq("organization_id", orgId)
      .eq("project_id", values.projectId)
      .order("position")
      .then(({ data, error }) => {
        if (error) {
          console.warn("Failed to load folders:", error.message);
          setMilestones([]);
          return;
        }
        setMilestones(data ?? []);
      })
      .finally(() => setLoadingFolders(false));
  }, [values.projectId, orgId]);

  return (
    <div className="space-y-6">
      <FormSection>
        <FormField label="Title" htmlFor={`${idPrefix}-title`} required>
          <Input
            id={`${idPrefix}-title`}
            required
            placeholder={isSubtask ? "Subtask title" : "Task title"}
            value={values.title}
            onChange={(e) => patch({ title: e.target.value })}
            className={fieldClass}
          />
        </FormField>

        <FormField label="Description">
          <RichTextEditor
            value={values.description}
            onChange={(description) => patch({ description })}
            members={mentions}
            placeholder="Describe what needs to be done… Type @ to mention someone."
            minHeight="120px"
          />
        </FormField>

        <FormField label="Attachments" htmlFor={`${idPrefix}-files`}>
          <FileUpload
            id={`${idPrefix}-files`}
            files={files}
            onFilesChange={onFilesChange}
            multiple
          />
        </FormField>

        <FormField label="Note">
          <RichTextEditor
            value={values.note}
            onChange={(note) => patch({ note })}
            members={mentions}
            placeholder="Internal notes (optional)… Type @ to mention someone."
            minHeight="90px"
          />
        </FormField>
      </FormSection>

      <FormSection title="Details">
        <div className={cn("grid gap-4", isSubtask ? "sm:grid-cols-1" : "sm:grid-cols-2")}>
          <FormField label="Priority">
            <Select
              value={values.priority}
              onValueChange={(v) => patch({ priority: v as TaskPriority })}
            >
              <SelectTrigger className={cn(fieldClass, "w-full")}>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {!isSubtask && (
            <FormField label="Project">
              <Select
                value={values.projectId || NONE}
                onValueChange={(v) => patch({
                  projectId: v === NONE ? "" : v,
                  milestoneId: "",
                })}
              >
                <SelectTrigger className={cn(fieldClass, "w-full")}>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No project (standalone)</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          )}
        </div>

        {!isSubtask && (
          <FormField label="Folder" hint={!values.projectId ? "Select a project first" : undefined}>
            <Select
              value={values.milestoneId || NONE}
              onValueChange={(v) => patch({ milestoneId: v === NONE ? "" : v })}
              disabled={!values.projectId || loadingFolders}
            >
              <SelectTrigger className={cn(fieldClass, "w-full")}>
                <SelectValue placeholder={loadingFolders ? "Loading folders…" : "Select folder"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No folder</SelectItem>
                {milestones.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}

        {isSubtask && (
          <p className="text-xs text-muted-foreground">
            Project and folder are inherited from the parent task.
          </p>
        )}

        <TaskAssigneesField
          id={`${idPrefix}-assignees`}
          members={members}
          selectedIds={values.assigneeIds}
          onChange={(assigneeIds) => patch({ assigneeIds })}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Due date" htmlFor={`${idPrefix}-due-date`}>
            <Input
              id={`${idPrefix}-due-date`}
              type="date"
              value={values.dueDate}
              onChange={(e) => patch({ dueDate: e.target.value })}
              className={fieldClass}
            />
          </FormField>

          <FormField label="Estimated time (hours)" htmlFor={`${idPrefix}-estimated-hours`}>
            <Input
              id={`${idPrefix}-estimated-hours`}
              type="number"
              min="0"
              step="0.25"
              placeholder="0"
              value={values.estimatedHours}
              onChange={(e) => patch({ estimatedHours: e.target.value })}
              className={fieldClass}
            />
          </FormField>
        </div>
      </FormSection>
    </div>
  );
}
