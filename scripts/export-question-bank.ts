import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { allQuestionRecords, classifyQuestion, MIN_TOPIC_QUESTIONS, OFFICIAL_QUESTION_COUNT, QUESTION_BANK_SIZE, QUESTION_BANK_VERSION, subjectCatalog } from "../lib/question-bank";

const root = resolve(import.meta.dirname, "..");
const sqlitePath = resolve(root, "public/downloads/vekto-question-bank.sqlite");
const manifestPath = resolve(root, "public/downloads/vekto-question-bank-manifest.json");
mkdirSync(dirname(sqlitePath), { recursive: true });
rmSync(sqlitePath, { force: true });

const quote = (value: unknown) => `'${String(value ?? "").replaceAll("'", "''")}'`;
const classified = allQuestionRecords.map((record) => ({ ...record, ...classifyQuestion(record.subject, record.topic, record.prompt) }));
const topics = [...new Map(classified.map((record) => [`${record.subject}\u0000${record.topicName}`, { subject: record.subject, section: record.sectionName, name: record.topicName }])).values()];

const sql: string[] = [
  "PRAGMA journal_mode=OFF;",
  "PRAGMA synchronous=OFF;",
  "CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
  "CREATE TABLE subjects (slug TEXT PRIMARY KEY, name TEXT NOT NULL, exam_question_count INTEGER NOT NULL, question_count INTEGER NOT NULL);",
  "CREATE TABLE topics (id INTEGER PRIMARY KEY, subject_slug TEXT NOT NULL, section_name TEXT NOT NULL, name TEXT NOT NULL, question_count INTEGER NOT NULL, UNIQUE(subject_slug, name));",
  "CREATE TABLE questions (id TEXT PRIMARY KEY, external_id TEXT NOT NULL, subject_slug TEXT NOT NULL, topic_id INTEGER NOT NULL, year INTEGER NOT NULL, session INTEGER NOT NULL, position INTEGER NOT NULL, question_type TEXT NOT NULL, prompt TEXT NOT NULL, options_json TEXT NOT NULL, correct_answer TEXT NOT NULL, explanation TEXT NOT NULL, images_json TEXT NOT NULL, source_url TEXT NOT NULL, official_pdf_url TEXT NOT NULL, attribution TEXT NOT NULL);",
  `INSERT INTO metadata VALUES ('bank_version', ${quote(QUESTION_BANK_VERSION)}), ('verified_for', 'НМТ-2026'), ('question_count', ${quote(QUESTION_BANK_SIZE)}), ('official_question_count', ${quote(OFFICIAL_QUESTION_COUNT)}), ('runtime_ai', 'none');`,
];

for (const [slug, subject] of subjectCatalog) {
  const count = classified.filter((record) => record.subject === slug).length;
  sql.push(`INSERT INTO subjects VALUES (${quote(slug)}, ${quote(subject.name)}, ${subject.examQuestionCount}, ${count});`);
}
const topicIds = new Map<string, number>();
topics.forEach((entry, index) => {
  const id = index + 1;
  topicIds.set(`${entry.subject}\u0000${entry.name}`, id);
  const count = classified.filter((record) => record.subject === entry.subject && record.topicName === entry.name).length;
  sql.push(`INSERT INTO topics VALUES (${id}, ${quote(entry.subject)}, ${quote(entry.section)}, ${quote(entry.name)}, ${count});`);
});
for (const record of classified) {
  sql.push(`INSERT INTO questions VALUES (${quote(record.id)}, ${quote(record.external_id)}, ${quote(record.subject)}, ${topicIds.get(`${record.subject}\u0000${record.topicName}`)}, ${record.year}, ${record.session}, ${record.position}, ${quote(record.question_type)}, ${quote(record.prompt)}, ${quote(JSON.stringify(record.options))}, ${quote(record.correct_answer)}, ${quote(record.explanation)}, ${quote(JSON.stringify(record.images))}, ${quote(record.source_url)}, ${quote(record.official_pdf_url)}, ${quote(record.attribution)});`);
}
sql.push("CREATE INDEX idx_questions_subject_topic ON questions(subject_slug, topic_id);", "CREATE INDEX idx_questions_subject_type ON questions(subject_slug, question_type);", "ANALYZE;", "VACUUM;");
const result = spawnSync("sqlite3", [sqlitePath], { input: sql.join("\n"), encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
if (result.status !== 0) throw new Error(result.stderr || "sqlite3 export failed");

const manifest = {
  name: "Vekto NMT question bank",
  version: QUESTION_BANK_VERSION,
  verifiedFor: "НМТ-2026",
  questionCount: QUESTION_BANK_SIZE,
  officialQuestionCount: OFFICIAL_QUESTION_COUNT,
  runtimeAI: false,
  minimumTrainingTopicSize: MIN_TOPIC_QUESTIONS,
  subjects: [...subjectCatalog.entries()].map(([slug, subject]) => ({
    slug,
    name: subject.name,
    examQuestionCount: subject.examQuestionCount,
    bankQuestionCount: classified.filter((record) => record.subject === slug).length,
    topicCount: new Set(classified.filter((record) => record.subject === slug && record.sectionName !== "Поза програмою НМТ-2026" && classified.filter((candidate) => candidate.subject === slug && candidate.topicName === record.topicName).length >= MIN_TOPIC_QUESTIONS).map((record) => record.topicName)).size,
  })),
};
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Exported ${QUESTION_BANK_SIZE} questions to ${sqlitePath}`);
