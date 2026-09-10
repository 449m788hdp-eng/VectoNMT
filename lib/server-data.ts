import { env } from "cloudflare:workers";

export function getDatabase() {
  const db = (env as unknown as { DB?: D1Database }).DB;
  if (!db) throw new Error("База даних тимчасово недоступна");
  return db;
}

export function kyivDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function noStore(status = 200) {
  return { status, headers: { "Cache-Control": "no-store" } };
}

