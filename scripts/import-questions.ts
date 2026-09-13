import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
const input = process.argv[2];
if (!input)
  throw Error(
    "Usage: npx tsx scripts/import-questions.ts /absolute/path/questions.json [--apply]",
  );
const option = z.object({
  marker: z.string().min(1),
  text: z.string(),
  images: z.array(z.string()).default([]),
});
const record = z.object({
  id: z.string().min(5),
  external_id: z.string(),
  subject: z.enum([
    "ukrainian",
    "mathematics",
    "history",
    "english",
    "german",
    "biology",
    "geography",
  ]),
  topic: z.string().min(1),
  section: z.string().min(1),
  subtopic: z.string().min(1),
  year: z.number().int(),
  session: z.number().int().min(0),
  position: z.number().int().positive(),
  question_type: z.enum([
    "single_choice",
    "matching",
    "ordering",
    "multiple_choice",
    "numeric",
    "type_6",
  ]),
  prompt: z.string().min(8),
  options: z.array(z.object({ title: z.string(), options: z.array(option) })),
  correct_answer: z.string().min(1),
  explanation: z.string().min(1),
  images: z.array(z.string()),
  source_url: z.string().url(),
  official_pdf_url: z.string(),
  attribution: z.string().min(1),
});
const incoming = z
  .array(record)
  .min(1)
  .parse(JSON.parse(readFileSync(input, "utf8")).questions);
const path = "data/vekto-practice-questions.json",
  bank = JSON.parse(readFileSync(path, "utf8"));
const official = JSON.parse(readFileSync("data/nmt-questions.json", "utf8"));
const ids = new Set(
  [...bank.questions, ...official.questions].map((q: { id: string }) => q.id),
);
for (const q of incoming) {
  if (ids.has(q.id)) throw Error(`Duplicate immutable ID: ${q.id}`);
  ids.add(q.id);
  if (q.session > 0 && !q.official_pdf_url)
    throw Error(`Official question needs original PDF: ${q.id}`);
}
if (process.argv.includes("--apply")) {
  bank.questions.push(...incoming);
  writeFileSync(path, JSON.stringify(bank, null, 2) + "\n");
}
console.log(
  `${incoming.length} validated records. ${process.argv.includes("--apply") ? "Imported. Increment data bank version, run db:export and tests, then publish." : "Dry run only. Review answers and attribution before --apply."}`,
);
