import questionData from "@/data/nmt-questions.json";
import practiceData from "@/data/vekto-practice-questions.json";

export type QuestionRecord = (typeof questionData.questions)[number] | (typeof practiceData.questions)[number];

export type ExamBlueprint = {
  durationMinutes: number;
  formats: Array<{ type: string; count: number; label: string }>;
};

export const subjectCatalog = new Map([
  ["mathematics", { name: "Математика", examQuestionCount: 22, required: 1, position: 1, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 15, label: "одна відповідь" }, { type: "matching", count: 3, label: "логічні пари" }, { type: "numeric", count: 4, label: "коротка відповідь" }] } satisfies ExamBlueprint }],
  ["ukrainian", { name: "Українська мова", examQuestionCount: 30, required: 1, position: 2, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 25, label: "одна відповідь" }, { type: "matching", count: 5, label: "логічні пари" }] } satisfies ExamBlueprint }],
  ["english", { name: "Англійська мова", examQuestionCount: 32, required: 0, position: 3, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 32, label: "читання та використання мови" }] } satisfies ExamBlueprint }],
  ["history", { name: "Історія України", examQuestionCount: 30, required: 1, position: 4, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 20, label: "одна відповідь" }, { type: "matching", count: 4, label: "логічні пари" }, { type: "ordering", count: 3, label: "послідовність" }, { type: "multiple_choice", count: 3, label: "три із семи" }] } satisfies ExamBlueprint }],
  ["german", { name: "Німецька мова", examQuestionCount: 32, required: 0, position: 5, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 32, label: "читання та використання мови" }] } satisfies ExamBlueprint }],
  ["biology", { name: "Біологія", examQuestionCount: 30, required: 0, position: 6, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 24, label: "одна відповідь" }, { type: "matching", count: 4, label: "логічні пари" }, { type: "type_6", count: 2, label: "три групи відповідей" }] } satisfies ExamBlueprint }],
  ["geography", { name: "Географія", examQuestionCount: 30, required: 0, position: 7, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 20, label: "одна відповідь" }, { type: "numeric", count: 4, label: "коротка відповідь" }, { type: "multiple_choice", count: 6, label: "три із семи" }] } satisfies ExamBlueprint }],
]);

export const officialTopicSections: Record<string, string[]> = {
  ukrainian: [
    "Фонетика. Графіка. Орфоепія. Орфографія",
    "Лексикологія. Фразеологія",
    "Будова слова. Словотвір",
    "Морфологія",
    "Синтаксис",
    "Стилістика",
    "Розвиток мовлення",
  ],
  mathematics: [
    "Числа і вирази",
    "Рівняння, нерівності і їх системи",
    "Функції",
    "Елементи комбінаторики, теорії ймовірностей та статистики",
    "Планіметрія",
    "Стереометрія",
  ],
  english: ["Читання", "Використання мови"],
  german: ["Читання", "Використання мови"],
  history: [
    "Українські землі у складі Речі Посполитої в другій половині XVI ст.",
    "Українські землі у складі Речі Посполитої в першій половині XVII ст.",
    "Національно-визвольна війна українського народу середини XVII ст.",
    "Козацька Україна наприкінці 50–80-х рр. XVII ст.",
    "Українські землі наприкінці XVII – у першій половині XVIII ст.",
    "Українські землі в другій половині XVIII ст.",
    "Українські землі у складі Російської імперії наприкінці XVIII – у першій половині XIX ст.",
    "Українські землі у складі Австрійської імперії наприкінці XVIII – у першій половині XIX ст.",
    "Культура України кінця XVIII – першої половини XIX ст.",
    "Українські землі у складі Російської імперії в другій половині XIX ст.",
    "Українські землі у складі Австро-Угорщини в другій половині XIX ст.",
    "Культура України в другій половині XIX – на початку XX ст.",
    "Українські землі у складі Російської імперії в 1900–1914 рр.",
    "Українські землі у складі Австро-Угорщини в 1900–1914 рр.",
    "Україна в роки Першої світової війни",
    "Початок Української революції",
    "Розгортання Української революції. Боротьба за відновлення державності",
    "Встановлення комуністичного тоталітарного режиму в Україні",
    "Утвердження більшовицького тоталітарного режиму в Україні",
    "Західноукраїнські землі в міжвоєнний період",
    "Україна в роки Другої світової війни",
    "Україна в перші повоєнні роки",
    "Україна в умовах десталінізації",
    "Україна в період загострення кризи радянської системи",
    "Відновлення незалежності України",
    "Становлення України як незалежної держави",
    "Творення нової України",
  ],
  biology: [
    "Хімічний склад, структура і функціонування клітин. Реалізація спадкової інформації",
    "Закономірності спадковості й мінливості",
    "Біорізноманіття",
    "Організм людини як біологічна система",
    "Основи екології й еволюційного вчення",
  ],
  geography: [
    "Загальна географія",
    "Географія материків і океанів",
    "Фізична географія України",
    "Населення України та світу",
    "Україна і світове господарство",
    "Регіони та країни",
    "Глобальні проблеми людства. Сталий розвиток",
  ],
};

const outsideProgram = "Поза програмою НМТ-2026";

function canonicalTopic(subject: string, topic: string) {
  const text = topic.replaceAll("–", "-").toLowerCase();
  if (subject === "ukrainian") {
    if (/фонет|граф|орфоеп|орфограф|наголос|апостроф|правопис|подвоєн|префікс|спрощенн/.test(text)) return officialTopicSections.ukrainian[0];
    if (/лекс|фразеолог|іншомов/.test(text)) return officialTopicSections.ukrainian[1];
    if (/будова слова|словотвір/.test(text)) return officialTopicSections.ukrainian[2];
    if (/морфолог|іменник|числівник|дієслов|дієприкмет|дієприслів/.test(text)) return officialTopicSections.ukrainian[3];
    if (/синтакс|пунктуац|реченн|члени речення|пряма й непряма/.test(text)) return officialTopicSections.ukrainian[4];
    if (/стиліст/.test(text)) return officialTopicSections.ukrainian[5];
    return officialTopicSections.ukrainian[6];
  }
  if (subject === "mathematics") {
    if (/комбінатор|ймовір|статист/.test(text)) return officialTopicSections.mathematics[3];
    if (/планіметр|трикут|чотирикут/.test(text)) return officialTopicSections.mathematics[4];
    if (/стереометр|простор|многогран|тіла обертання/.test(text)) return officialTopicSections.mathematics[5];
    if (/рівнян|нерівност|систем/.test(text)) return officialTopicSections.mathematics[1];
    if (/функц|похідн|послідовн/.test(text)) return officialTopicSections.mathematics[2];
    return officialTopicSections.mathematics[0];
  }
  if (subject === "english" || subject === "german") return text.startsWith("читання") ? "Читання" : "Використання мови";
  if (subject === "biology") {
    if (/хімічний склад|клітин|спадкової інформації|обмін речовин|еукаріот/.test(text)) return officialTopicSections.biology[0];
    if (/спадковості|мінливості|селекц|біотехнолог/.test(text)) return officialTopicSections.biology[1];
    if (/біорізноманіт|вірус|рослин|гриб|тварин|прокаріот|систематик/.test(text)) return officialTopicSections.biology[2];
    if (/організм людини|нервов|кров|травл|сечовид|опорно|сенсор/.test(text)) return officialTopicSections.biology[3];
    return officialTopicSections.biology[4];
  }
  if (subject === "geography") {
    if (/материк|океан|австрал|євраз/.test(text)) return officialTopicSections.geography[1];
    if (/фізична географія україни|природні умови|ландшафт|тектонічна будова/.test(text)) return officialTopicSections.geography[2];
    if (/населення|демограф|розселен|урбаніза|густота/.test(text)) return officialTopicSections.geography[3];
    if (/господарств|сектор економіки|промислов|виробництв|тнк|національна економіка/.test(text)) return officialTopicSections.geography[4];
    if (/регіони та країни|політична карта|німеччин|кореї|туризм/.test(text)) return officialTopicSections.geography[5];
    if (/глобальн|сталий розвиток|природокористув/.test(text)) return officialTopicSections.geography[6];
    return officialTopicSections.geography[0];
  }
  if (subject === "history") {
    const normalized = (value: string) => value.replaceAll("–", "-").replaceAll("у складі", "в складі").replaceAll(/\s+/g, " ").toLowerCase();
    const normalizedTopic = normalized(topic);
    const match = officialTopicSections.history.find((section) => normalizedTopic.includes(normalized(section)) || normalized(section).includes(normalizedTopic));
    return match ?? outsideProgram;
  }
  return topic;
}

export const allQuestionRecords: QuestionRecord[] = [...questionData.questions, ...practiceData.questions] as QuestionRecord[];

const preparedSubjects = new Set<string>();

export async function ensureSubjectSeeded(db: D1Database, subject: string) {
  const catalog = subjectCatalog.get(subject);
  if (!catalog) return false;
  if (preparedSubjects.has(subject)) return true;
  const records = allQuestionRecords.filter((record) => record.subject === subject);
  const allowedTopics = [...(officialTopicSections[subject] ?? []), outsideProgram];
  const placeholders = allowedTopics.map((_, index) => `?${index + 2}`).join(", ");
  const existing = await db.prepare(`SELECT COUNT(*) AS count FROM questions q JOIN topics t ON t.id=q.topic_id WHERE q.subject_slug=?1 AND t.name IN (${placeholders})`).bind(subject, ...allowedTopics).first<{ count: number }>();
  if ((existing?.count ?? 0) === records.length) {
    preparedSubjects.add(subject);
    return true;
  }

  const statements: D1PreparedStatement[] = [
    db.prepare("INSERT OR IGNORE INTO subjects (slug, name, exam_question_count, required, position) VALUES (?1, ?2, ?3, ?4, ?5)").bind(subject, catalog.name, catalog.examQuestionCount, catalog.required, catalog.position),
  ];
  for (const topic of allowedTopics) statements.push(db.prepare("INSERT OR IGNORE INTO topics (subject_slug, name) VALUES (?1, ?2)").bind(subject, topic));
  for (let offset = 0; offset < statements.length; offset += 50) await db.batch(statements.slice(offset, offset + 50));

  const topics = await db.prepare("SELECT id, name FROM topics WHERE subject_slug = ?1").bind(subject).all<{ id: number; name: string }>();
  const topicIds = new Map(topics.results.map((topic) => [topic.name, topic.id]));
  const questionStatements = records.map((record) => db.prepare(
    `INSERT INTO questions (id, external_id, subject_slug, topic_id, year, session, position, question_type, prompt, options_json, correct_answer, explanation, images_json, source_url, official_pdf_url, attribution)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
     ON CONFLICT(id) DO UPDATE SET external_id=excluded.external_id, topic_id=excluded.topic_id, question_type=excluded.question_type, prompt=excluded.prompt, options_json=excluded.options_json, correct_answer=excluded.correct_answer, explanation=excluded.explanation, images_json=excluded.images_json, source_url=excluded.source_url, official_pdf_url=excluded.official_pdf_url, attribution=excluded.attribution`
  ).bind(record.id, record.external_id, subject, topicIds.get(canonicalTopic(subject, record.topic)), record.year, record.session, record.position, record.question_type, record.prompt, JSON.stringify(record.options), record.correct_answer, record.explanation, JSON.stringify(record.images), record.source_url, record.official_pdf_url, record.attribution));
  for (let offset = 0; offset < questionStatements.length; offset += 50) await db.batch(questionStatements.slice(offset, offset + 50));
  preparedSubjects.add(subject);
  return true;
}
