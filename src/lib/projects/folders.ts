export type ProjectFolderView = {
  id: string | null;
  title: string;
  isDefault?: boolean;
};

type FolderTask = { milestone_id?: string | null };

export function buildProjectFolders(
  milestones: { id: string; title: string }[],
  tasks: FolderTask[],
): ProjectFolderView[] {
  if (milestones.length === 0) {
    return [{ id: null, title: "General", isDefault: true }];
  }

  const folders: ProjectFolderView[] = milestones.map((m) => ({
    id: m.id,
    title: m.title,
  }));

  const hasUnfiled = tasks.some((t) => !t.milestone_id);
  if (hasUnfiled) {
    folders.unshift({ id: null, title: "No folder", isDefault: true });
  }

  return folders;
}

export function tasksInFolder<T extends FolderTask>(tasks: T[], folderId: string | null): T[] {
  if (folderId === null) {
    return tasks.filter((t) => !t.milestone_id);
  }
  return tasks.filter((t) => t.milestone_id === folderId);
}
