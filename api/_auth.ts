import { timingSafeEqual } from "node:crypto";

function sameSecret(candidate: string, expected: string): boolean {
  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function requireApiSecret(req: any, res: any): boolean {
  const expected = process.env.TASK_TRACKER_API_SECRET;
  const authorization =
    typeof req.headers?.authorization === "string" ? req.headers.authorization : "";
  const bearer = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const header = typeof req.headers?.["x-task-tracker-key"] === "string"
    ? req.headers["x-task-tracker-key"]
    : "";
  const candidate = bearer || header;

  if (!expected || !candidate || !sameSecret(candidate, expected)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  return true;
}
