export function isMissingColumnError(error: { code?: string; message?: string }) {
  return (
    error.code === "PGRST204"
    || error.message?.includes("schema cache")
    || error.message?.includes("Could not find the")
  );
}
