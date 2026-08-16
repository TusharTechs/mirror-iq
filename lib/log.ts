export function logServer(event: string, fields: Record<string, unknown> = {}) {
  // Lightweight structured logging.
  // Never log API keys, raw images, or unnecessary personal data.
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      event,
      ...fields,
    })
  );
}