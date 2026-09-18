import { getDatabase } from "./server-data";
import { PLATFORM_BANK_VERSION } from "./platform-bank-version";
import spec from "@/data/nmt-exam-spec.json";

const subjectSlugs = Object.keys(spec.subjects);

// Keep the large seed modules out of ordinary page loads. They are needed only
// for a new database or after an offline bank update.
export async function bootstrapQuestionBank() {
  const state = await getDatabase()
    .prepare("SELECT slug,bank_version FROM subjects")
    .all<{ slug: string; bank_version: number }>();
  const versions = new Map(
    state.results.map((subject) => [subject.slug, subject.bank_version]),
  );
  const missing = subjectSlugs.filter(
    (slug) => (versions.get(slug) ?? 0) < PLATFORM_BANK_VERSION,
  );
  if (missing.length) {
    const { bootstrapSubject } = await import("./platform-bootstrap");
    for (const slug of missing) await bootstrapSubject(slug);
  }
  return { ready: true, updated: missing.length };
}
