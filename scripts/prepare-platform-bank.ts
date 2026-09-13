import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import {
  allQuestionRecords,
  classifyQuestion,
  subjectCatalog,
  topicTaxonomy,
} from "../lib/question-bank";
import { officialTables } from "../lib/nmt-scoring";
import spec from "../data/nmt-exam-spec.json";

// Offline import only. No AI, classification or content generation runs on a test request.
const quote = (v: unknown) => `'${String(v ?? "").replaceAll("'", "''")}'`;
const earlyHistory = [
  "Вступ до історії України",
  "Стародавня історія України",
  "Русь-Україна (Київська держава)",
  "Королівство Руське (Галицько-Волинська держава). Монгольська навала",
  "Руські удільні князівства у складі іноземних держав у другій половині XIV – першій половині XVI ст. Кримське ханство",
];
topicTaxonomy.history.unshift({
  name: "Стародавня та середньовічна Україна",
  topics: earlyHistory,
});
const sql: string[] = [];
const index: Record<string, unknown[]> = {};
for (const [slug, s] of subjectCatalog) {
  sql.push(
    `INSERT INTO subjects(slug,name,exam_question_count,required,position,bank_version) VALUES(${quote(slug)},${quote(s.name)},${s.examQuestionCount},${s.required},${s.position},6) ON CONFLICT(slug) DO UPDATE SET bank_version=6;`,
  );
  sql.push(`UPDATE topics SET position=-1 WHERE subject_slug=${quote(slug)};`);
  for (const [i, section] of topicTaxonomy[slug].entries())
    for (const [j, name] of section.topics.entries())
      sql.push(
        `INSERT INTO topics(subject_slug,name,section_name,position) VALUES(${quote(slug)},${quote(name)},${quote(section.name)},${i * 100 + j}) ON CONFLICT(subject_slug,name) DO UPDATE SET section_name=excluded.section_name,position=excluded.position;`,
      );
  const config = {
    ...spec.subjects[slug as keyof typeof spec.subjects],
    stageSeconds: spec.stageSeconds,
    breakSeconds: spec.breakSeconds,
    instructionsUrl: spec.instructionsUrl,
    scoringUrl: spec.scoringUrl,
    scaleUrl: spec.scaleUrl,
  };
  sql.push(
    `INSERT INTO exam_configs VALUES(${quote(slug)},${quote(JSON.stringify(config))},${quote(JSON.stringify(Object.fromEntries(officialTables[slug])))},2026) ON CONFLICT(subject_slug) DO UPDATE SET config_json=excluded.config_json,scale_json=excluded.scale_json;`,
  );
}
const canonical = new Set<string>();
let activeCount = 0;
for (const q of allQuestionRecords) {
  const explicit = q as typeof q & { section?: string; subtopic?: string };
  let c =
    explicit.section && explicit.subtopic
      ? { sectionName: explicit.section, topicName: explicit.subtopic }
      : classifyQuestion(q.subject, q.topic, q.prompt);
  if (c.sectionName.includes("Поза програмою"))
    c = {
      sectionName: "Стародавня та середньовічна Україна",
      topicName:
        earlyHistory.find((t) => q.topic.includes(t) || t.includes(q.topic)) ??
        q.topic,
    };
  sql.push(
    `INSERT OR IGNORE INTO topics(subject_slug,name,section_name,position) VALUES(${quote(q.subject)},${quote(c.topicName)},${quote(c.sectionName)},999);`,
  );
  const official = q.session > 0;
  const prompt = q.prompt
    .replace(
      /^(?:Укажіть правильну відповідь|Виберіть точне твердження|Визначте відповідь за змістом програми|Оберіть правильну відповідь|Проаналізуйте наведені варіанти)\.\s*/,
      "",
    )
    .replace(/\s*Version \d+: choose the exact statement\./, "")
    .replace(/\s*\(?(?:Варіант|Версія)\s*\d+\)?\.?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        q.subject,
        prompt,
        q.options
          .map((g) => g.options.map((o) => [o.text, o.images ?? []]).sort())
          .sort(),
        q.images,
      ]),
    )
    .digest("hex");
  const enabled = official || !canonical.has(key);
  canonical.add(key);
  if (enabled) activeCount++;
  const format =
    official && ["english", "german"].includes(q.subject)
      ? q.position <= 5 || (q.position >= 11 && q.position <= 16)
        ? "language_matching"
        : q.position >= 17
          ? "gap_fill"
          : "single_choice"
      : q.question_type;
  index[q.id] = [
    c.sectionName,
    c.topicName,
    key,
    enabled ? 1 : 0,
    official ? "official" : "practice",
    format,
  ];
  const values = [
    q.id,
    q.external_id,
    q.subject,
    q.year,
    q.session,
    q.position,
    q.question_type,
    q.prompt,
    JSON.stringify(q.options),
    q.correct_answer,
    q.explanation,
    JSON.stringify(q.images),
    q.source_url,
    q.official_pdf_url,
    q.attribution,
    key,
    enabled ? 1 : 0,
    official ? "official" : "practice",
    format,
  ];
  sql.push(
    `INSERT INTO questions(id,external_id,subject_slug,year,session,position,question_type,prompt,options_json,correct_answer,explanation,images_json,source_url,official_pdf_url,attribution,canonical_key,active,source_kind,exam_format,topic_id) VALUES(${values.map(quote).join(",")},(SELECT id FROM topics WHERE subject_slug=${quote(q.subject)} AND name=${quote(c.topicName)})) ON CONFLICT(id) DO UPDATE SET topic_id=excluded.topic_id,canonical_key=excluded.canonical_key,active=excluded.active,source_kind=excluded.source_kind,exam_format=excluded.exam_format;`,
  );
}
writeFileSync("data/platform-seed.sql", sql.join("\n") + "\n");
writeFileSync(
  "data/platform-bank-index.json",
  JSON.stringify({ version: 6, topics: topicTaxonomy, questions: index }),
);
console.log({
  records: allQuestionRecords.length,
  active: activeCount,
  duplicateRecords: allQuestionRecords.length - activeCount,
});
