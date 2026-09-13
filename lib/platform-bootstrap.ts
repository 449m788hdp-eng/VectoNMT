import index from "@/data/platform-bank-index.json";
import spec from "@/data/nmt-exam-spec.json";
import { allQuestionRecords, subjectCatalog } from "./question-bank";
import { officialTables } from "./nmt-scoring";
import { getDatabase } from "./server-data";

// Versioned data installation, separate from schema migrations. Classification
// is prepared offline. Exam/training requests subsequently read D1 only.
export async function bootstrapSubject(slug: string) {
  const db = getDatabase(),
    s = subjectCatalog.get(slug);
  if (!s) throw Error("Невідомий предмет");
  const state = await db
    .prepare("SELECT bank_version FROM subjects WHERE slug=?")
    .bind(slug)
    .first<{ bank_version: number }>();
  if (state && state.bank_version >= index.version) return;
  await db
    .prepare(
      `INSERT INTO subjects(slug,name,exam_question_count,required,position,bank_version) VALUES(?,?,?,?,?,0) ON CONFLICT(slug) DO NOTHING`,
    )
    .bind(slug, s.name, s.examQuestionCount, s.required, s.position)
    .run();
  const topicRows = (
    index.topics as Record<string, { name: string; topics: string[] }[]>
  )[slug];
  await db
    .prepare("UPDATE topics SET position=-1 WHERE subject_slug=?")
    .bind(slug)
    .run();
  const statements = topicRows.flatMap((section, i) =>
    section.topics.map((name, j) =>
      db
        .prepare(
          `INSERT INTO topics(subject_slug,name,section_name,position) VALUES(?,?,?,?) ON CONFLICT(subject_slug,name) DO UPDATE SET section_name=excluded.section_name,position=excluded.position`,
        )
        .bind(slug, name, section.name, i * 100 + j),
    ),
  );
  const records = allQuestionRecords.filter((q) => q.subject === slug);
  const metadata = index.questions as unknown as Record<
    string,
    [string, string, string, number, string, string]
  >;
  for (const q of records) {
    const c = metadata[q.id];
    statements.push(
      db
        .prepare(
          "INSERT INTO topics(subject_slug,name,section_name,position) VALUES(?,?,?,999) ON CONFLICT(subject_slug,name) DO UPDATE SET section_name=excluded.section_name,position=CASE WHEN topics.position<0 THEN 999 ELSE topics.position END",
        )
        .bind(slug, c[1], c[0]),
    );
  }
  for (let i = 0; i < statements.length; i += 50)
    await db.batch(statements.slice(i, i + 50));
  const ts = await db
    .prepare("SELECT id,name FROM topics WHERE subject_slug=?")
    .bind(slug)
    .all<{ id: number; name: string }>();
  const topicIds = new Map(ts.results.map((t) => [t.name, t.id]));
  const updates = records.map((q) => {
    const c = metadata[q.id];
    return db
      .prepare(
        `INSERT INTO questions(id,external_id,subject_slug,topic_id,year,session,position,question_type,prompt,options_json,correct_answer,explanation,images_json,source_url,official_pdf_url,attribution,canonical_key,active,source_kind,exam_format) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET topic_id=excluded.topic_id,canonical_key=excluded.canonical_key,active=excluded.active,source_kind=excluded.source_kind,exam_format=excluded.exam_format`,
      )
      .bind(
        q.id,
        q.external_id,
        slug,
        topicIds.get(c[1])!,
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
        c[2],
        c[3],
        c[4],
        c[5],
      );
  });
  for (let i = 0; i < updates.length; i += 50)
    await db.batch(updates.slice(i, i + 50));
  const config = {
    ...spec.subjects[slug as keyof typeof spec.subjects],
    stageSeconds: spec.stageSeconds,
    breakSeconds: spec.breakSeconds,
    instructionsUrl: spec.instructionsUrl,
    scoringUrl: spec.scoringUrl,
    scaleUrl: spec.scaleUrl,
  };
  await db.batch([
    db
      .prepare(
        `INSERT INTO exam_configs(subject_slug,config_json,scale_json,year) VALUES(?,?,?,2026) ON CONFLICT(subject_slug) DO UPDATE SET config_json=excluded.config_json,scale_json=excluded.scale_json`,
      )
      .bind(
        slug,
        JSON.stringify(config),
        JSON.stringify(Object.fromEntries(officialTables[slug])),
      ),
    db
      .prepare("UPDATE subjects SET bank_version=? WHERE slug=?")
      .bind(index.version, slug),
  ]);
}
