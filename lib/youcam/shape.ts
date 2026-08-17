import { logServer } from "../log";

// Logs structure (keys + types + lengths) only. Never logs values,
// never logs image data, never logs credentials.
export function describeShape(value: unknown, depth = 0): unknown {
  if (depth > 4) return "…";
  if (value === null) return "null";

  const t = typeof value;

  if (t === "number" || t === "boolean") return t;
  if (t === "string") {
    const s = value as string;
    if (s.startsWith("data:")) return "string(data-uri)";
    return s.length > 64 ? `string(${s.length} chars)` : "string";
  }
  if (Array.isArray(value)) {
    return [`array(${value.length})`, value.length ? describeShape(value[0], depth + 1) : undefined];
  }
  if (t === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = describeShape(v, depth + 1);
    }
    return out;
  }
  return t;
}

export function logResponseShape(route: string, parsed: unknown) {
  if (process.env.YOUCAM_LOG_SHAPE !== "true") return;
  logServer("youcam.response_shape", { route, shape: describeShape(parsed) });
}