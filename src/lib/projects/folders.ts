export type ProjectFolderView = {
  id: string;
  title: string;
};

type FolderTask = { milestone_id?: string | null };

/** Real milestone folders only — unfiled tasks are shown at project level. */
export function buildProjectFolders(
  milestones: { id: string; title: string }[],
): ProjectFolderView[] {
  return milestones.map((m) => ({
    id: m.id,
    title: m.title,
  }));
}

export function tasksInFolder<T extends FolderTask>(tasks: T[], folderId: string | null): T[] {
  if (folderId === null) {
    return tasks.filter((t) => !t.milestone_id);
  }
  return tasks.filter((t) => t.milestone_id === folderId);
}
