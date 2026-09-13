import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { pointsFor } from "../lib/nmt-scoring";
import index from "../data/platform-bank-index.json";
const temp = mkdtempSync(join(tmpdir(), "vekto-bank-"));
const target = join(temp, "bank.sqlite");
const sql =
  readdirSync("drizzle")
    .filter((n) => /^\d+.*\.sql$/.test(n))
    .sort()
    .map((n) => readFileSync(join("drizzle", n), "utf8"))
    .join("\n") +
  "\n" +
  readFileSync("data/platform-seed.sql", "utf8");
const built = spawnSync("sqlite3", [target], {
  input: sql,
  encoding: "utf8",
  maxBuffer: 8 * 1024 * 1024,
});
if (built.status !== 0) throw Error(built.stderr);
function query(sql: string) {
  const result = spawnSync("sqlite3", ["-json", target, sql], {
    encoding: "utf8",
  });
  if (result.status !== 0) throw Error(result.stderr);
  return JSON.parse(result.stdout || "[]");
}
const subjects = query(
  `SELECT s.slug,s.name,COUNT(q.id) records,SUM(q.active) available,SUM(q.source_kind='official') official FROM subjects s JOIN questions q ON q.subject_slug=s.slug GROUP BY s.slug`,
);
const questions = query(
  "SELECT subject_slug,session,question_type,correct_answer,exam_format FROM questions WHERE source_kind='official'",
);
for (const config of query("SELECT * FROM exam_configs"))
  for (const session of [1, 2]) {
    const spec = JSON.parse(config.config_json),
      qs = questions.filter(
        (q: any) =>
          q.subject_slug === config.subject_slug && q.session === session,
      );
    if (
      qs.length !== spec.count ||
      qs.reduce(
        (n: number, q: any) =>
          n + pointsFor(q.question_type, "", q.correct_answer).max,
        0,
      ) !== spec.max
    )
      throw Error(`Invalid blueprint ${config.subject_slug}/${session}`);
    for (const [type, count] of spec.formats)
      if (qs.filter((q: any) => q.exam_format === type).length !== count)
        throw Error("Invalid format distribution");
  }
const manifest = {
  name: "Vekto NMT question bank",
  version: index.version,
  runtimeAI: false,
  records: subjects.reduce((n: number, s: any) => n + s.records, 0),
  available: subjects.reduce((n: number, s: any) => n + s.available, 0),
  official: 412,
  subjects,
  notes:
    "active=0: archived technical duplicate; official=published NMT-2025; practice=authored exercise. User profiles and test history are never included.",
};
renameSync(target, "public/downloads/vekto-question-bank.sqlite");
writeFileSync(
  "public/downloads/vekto-question-bank-manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(manifest);
