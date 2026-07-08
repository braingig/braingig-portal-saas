import {
  sendProjectMentionEmails,
  sendWorkspaceProjectCreatedEmails,
} from "@/lib/email/notifications";
import {
  fetchOrgOwnerAndAdminIds,
  insertInAppNotifications,
  projectLink,
  resolveActorName,
  uniqueUserIds,
} from "@/lib/notifications/helpers";
import { getProjectStatusMeta } from "@/lib/projects/status";
import { extractMentionIdsFromHtml } from "@/lib/tasks/comment-mentions";
import type { TaskOrgMember } from "@/lib/tasks/types";

export async function notifyProjectCreated({
  orgId,
  projectId,
  projectName,
  actorId,
}: {
  orgId: string;
  projectId: string;
  projectName: string;
  actorId: string;
}) {
  const actorName = await resolveActorName(actorId);
  const recipientIds = uniqueUserIds(await fetchOrgOwnerAndAdminIds(orgId), actorId);

  await insertInAppNotifications(
    recipientIds.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "project_created",
      title: "New project created",
      body: `${actorName} created project "${projectName}"`,
      link: projectLink(projectId),
      entity_type: "project",
      entity_id: projectId,
    })),
  );

  await sendWorkspaceProjectCreatedEmails({
    orgId,
    projectId,
    projectName,
    actorName,
  });
}

export async function notifyProjectStatusChanged({
  orgId,
  projectId,
  projectName,
  actorId,
  previousStatus,
  nextStatus,
}: {
  orgId: string;
  projectId: string;
  projectName: string;
  actorId: string;
  previousStatus: string;
  nextStatus: string;
}) {
  if (previousStatus === nextStatus) return;

  const actorName = await resolveActorName(actorId);
  const label = getProjectStatusMeta(nextStatus).label;
  const recipientIds = uniqueUserIds(await fetchOrgOwnerAndAdminIds(orgId), actorId);

  await insertInAppNotifications(
    recipientIds.map((userId) => ({
      user_id: userId,
      organization_id: orgId,
      type: "project_status",
      title: "Project status updated",
      body: `${actorName} set "${projectName}" to ${label}`,
      link: projectLink(projectId),
      entity_type: "project",
      entity_id: projectId,
    })),
  );
}

export async function notifyProjectMentions({
  orgId,
  projectId,
  projectName,
  actorId,
  description,
  note,
  previousDescription = "",
  previousNote = "",
  mentionMembers = [],
}: {
  orgId: string;
  projectId: string;
  projectName: string;
  actorId: string;
  description: string;
  note: string;
  previousDescription?: string;
  previousNote?: string;
  mentionMembers?: TaskOrgMember[];
}) {
  const actorName = await resolveActorName(actorId);
  const previousDescriptionIds = new Set(extractMentionIdsFromHtml(previousDescription, mentionMembers));
  const previousNoteIds = new Set(extractMentionIdsFromHtml(previousNote, mentionMembers));

  const descriptionMentions = extractMentionIdsFromHtml(description, mentionMembers)
    .filter((id) => id !== actorId && !previousDescriptionIds.has(id));
  const noteMentions = extractMentionIdsFromHtml(note, mentionMembers)
    .filter((id) => id !== actorId && !previousNoteIds.has(id));

  if (descriptionMentions.length > 0) {
    await insertInAppNotifications(
      descriptionMentions.map((userId) => ({
        user_id: userId,
        organization_id: orgId,
        type: "mention",
        title: `${actorName} mentioned you`,
        body: `In the description on project: ${projectName}`,
        link: projectLink(projectId),
        entity_type: "project",
        entity_id: projectId,
      })),
    );

    await sendProjectMentionEmails({
      orgId,
      projectId,
      projectName,
      mentionUserIds: descriptionMentions,
      authorName: actorName,
      context: "description",
    });
  }

  if (noteMentions.length > 0) {
    await insertInAppNotifications(
      noteMentions.map((userId) => ({
        user_id: userId,
        organization_id: orgId,
        type: "mention",
        title: `${actorName} mentioned you`,
        body: `In the note on project: ${projectName}`,
        link: projectLink(projectId),
        entity_type: "project",
        entity_id: projectId,
      })),
    );

    await sendProjectMentionEmails({
      orgId,
      projectId,
      projectName,
      mentionUserIds: noteMentions,
      authorName: actorName,
      context: "note",
    });
  }
}
