import { runTaskDueReminders } from "@/lib/tasks/due-reminders.server";

function readCronSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice("Bearer ".length).trim() || null;
  }

  const headerSecret = request.headers.get("x-cron-secret")?.trim();
  return headerSecret || null;
}

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    console.error("[task-due-reminders] CRON_SECRET is not configured");
    return false;
  }

  return readCronSecret(request) === expected;
}

export async function handleTaskDueRemindersCron(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!isAuthorized(request)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await runTaskDueReminders();
    console.info("[task-due-reminders] Completed", result);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[task-due-reminders] Failed:", message);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
