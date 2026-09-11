import questionData from "@/data/nmt-questions.json";
import practiceData from "@/data/vekto-practice-questions.json";
import taxonomyData from "@/data/nmt-topic-taxonomy.json";

export type QuestionRecord = (typeof questionData.questions)[number] | (typeof practiceData.questions)[number];
export type ExamBlueprint = { durationMinutes: number; formats: Array<{ type: string; count: number; label: string }> };
export type TopicSection = { name: string; topics: string[] };

export const QUESTION_BANK_VERSION = taxonomyData.version;
export const QUESTION_BANK_SIZE = questionData.questions.length + practiceData.questions.length;
export const OFFICIAL_QUESTION_COUNT = questionData.questions.length;
export const MIN_TOPIC_QUESTIONS = 10;

export const subjectCatalog = new Map([
  ["mathematics", { name: "Математика", examQuestionCount: 22, required: 1, position: 1, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 15, label: "15 × одна відповідь" }, { type: "matching", count: 3, label: "3 × логічні пари" }, { type: "numeric", count: 4, label: "4 × коротка відповідь" }] } satisfies ExamBlueprint }],
  ["ukrainian", { name: "Українська мова", examQuestionCount: 30, required: 1, position: 2, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 25, label: "25 × одна відповідь" }, { type: "matching", count: 5, label: "5 × логічні пари" }] } satisfies ExamBlueprint }],
  ["english", { name: "Англійська мова", examQuestionCount: 32, required: 0, position: 3, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 32, label: "читання та використання мови" }] } satisfies ExamBlueprint }],
  ["history", { name: "Історія України", examQuestionCount: 30, required: 1, position: 4, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 20, label: "20 × одна відповідь" }, { type: "matching", count: 4, label: "4 × логічні пари" }, { type: "ordering", count: 3, label: "3 × послідовність" }, { type: "multiple_choice", count: 3, label: "3 × три із семи" }] } satisfies ExamBlueprint }],
  ["german", { name: "Німецька мова", examQuestionCount: 32, required: 0, position: 5, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 32, label: "читання та використання мови" }] } satisfies ExamBlueprint }],
  ["biology", { name: "Біологія", examQuestionCount: 30, required: 0, position: 6, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 24, label: "24 × одна відповідь" }, { type: "matching", count: 4, label: "4 × логічні пари" }, { type: "type_6", count: 2, label: "2 × три групи відповідей" }] } satisfies ExamBlueprint }],
  ["geography", { name: "Географія", examQuestionCount: 30, required: 0, position: 7, blueprint: { durationMinutes: 60, formats: [{ type: "single_choice", count: 20, label: "20 × одна відповідь" }, { type: "numeric", count: 4, label: "4 × коротка відповідь" }, { type: "multiple_choice", count: 6, label: "6 × три із семи" }] } satisfies ExamBlueprint }],
]);

export const topicTaxonomy = taxonomyData.subjects as Record<string, TopicSection[]>;
export const officialTopicSections = Object.fromEntries(Object.entries(topicTaxonomy).map(([subject, sections]) => [subject, sections.map((section) => section.name)])) as Record<string, string[]>;
export const allQuestionRecords: QuestionRecord[] = [...questionData.questions, ...practiceData.questions] as QuestionRecord[];
export const OUTSIDE_PROGRAM = "Поза програмою НМТ-2026";

const normalize = (value: string) => value.replaceAll("–", "-").replaceAll("—", "-").replaceAll("у складі", "в складі").replaceAll(/\s+/g, " ").trim().toLowerCase();
const practiceSourceTopics = new Set(practiceData.questions.map((question) => normalize(question.topic)));

function topic(subject: string, sectionIndex: number, topicIndex: number) {
  const section = topicTaxonomy[subject][sectionIndex];
  return { sectionName: section.name, topicName: section.topics[topicIndex] };
}

export function classifyQuestion(subject: string, sourceTopic: string, prompt: string) {
  const promptText = normalize(prompt);
  // Practice records carry a broad programme section in `topic`. Using that label
  // for keyword matching used to push an entire section into the first matching
  // narrow topic (for example every phonetics task into “Наголос”). For authored
  // practice tasks the prompt is the source of truth; official records retain the
  // source label because it is already granular and useful for classification.
  const text = practiceSourceTopics.has(normalize(sourceTopic)) ? promptText : normalize(`${sourceTopic} ${prompt}`);
  if (subject === "history") {
    const entries = topicTaxonomy.history.flatMap((section) => section.topics.map((topicName) => ({ sectionName: section.name, topicName })));
    const source = normalize(sourceTopic);
    const match = entries.find((entry) => source.includes(normalize(entry.topicName)) || normalize(entry.topicName).includes(source));
    return match ?? { sectionName: OUTSIDE_PROGRAM, topicName: OUTSIDE_PROGRAM };
  }
  if (subject === "ukrainian") {
    if (/наголос|орфоеп/.test(text)) return topic(subject, 0, 1);
    if (/чергуван|зміни звуків/.test(text)) return topic(subject, 0, 2);
    if (/ненаголошен/.test(text)) return topic(subject, 0, 3);
    if (/м’якого знака|м'якого знака|апостроф/.test(text)) return topic(subject, 0, 4);
    if (/спрощенн|подвоєн|подовжен/.test(text)) return topic(subject, 0, 5);
    if (/префікс/.test(text) && /правопис|орфограф/.test(text)) return topic(subject, 0, 6);
    if (/складних слів/.test(text)) return topic(subject, 0, 7);
    if (/іншомовн|запозичен/.test(text) && /правопис|орфограф/.test(text)) return topic(subject, 0, 8);
    if (/фонет|граф|орфограф|написано правильно|правопис/.test(text)) return topic(subject, 0, 9);
    if (/фразеолог/.test(text)) return topic(subject, 1, 4);
    if (/український відповідник|іншомовн|запозичен/.test(text)) return topic(subject, 1, 3);
    if (/синонім|антонім|омонім/.test(text)) return topic(subject, 1, 1);
    if (/лексична норма|лексик/.test(text)) return topic(subject, 1, 2);
    if (/лексичне значення/.test(text)) return topic(subject, 1, 0);
    if (/префіксальним способом|способ.*словотвор/.test(text)) return topic(subject, 2, 1);
    if (/будова слова|значущі частини|корінь|суфікс/.test(text)) return topic(subject, 2, 0);
    if (/кличн/.test(text)) return topic(subject, 3, 2);
    if (/відмінювання іменник|відмінкових форм|прізвищ/.test(text)) return topic(subject, 3, 1);
    if (/ступенів порівняння прикметник|прикметник/.test(text)) return topic(subject, 3, 3);
    if (/числівник/.test(text)) return topic(subject, 3, 4);
    if (/займенник/.test(text)) return topic(subject, 3, 5);
    if (/дієприкмет/.test(text)) return topic(subject, 3, 7);
    if (/дієприслів/.test(text)) return topic(subject, 3, 8);
    if (/дієслов|наказовий спосіб/.test(text)) return topic(subject, 3, 6);
    if (/прислівник|прийменник|частк|сполучник/.test(text)) return topic(subject, 3, 9);
    if (/частиною мови|частини мови|морфолог/.test(text)) return topic(subject, 3, 0);
    if (/пряма й непряма|прямою мовою/.test(text)) return topic(subject, 4, 7);
    if (/однорідн/.test(text)) return topic(subject, 4, 3);
    if (/відокремлен/.test(text)) return topic(subject, 4, 4);
    if (/вставн|звертан/.test(text)) return topic(subject, 4, 5);
    if (/складн.*реченн|складнопідряд/.test(text)) return topic(subject, 4, 6);
    if (/тире|розділові знаки|пунктуац/.test(text)) return topic(subject, 4, 8);
    if (/головн.*член|другорядн.*член|підмет|додаток/.test(text)) return topic(subject, 4, 1);
    if (/граматична основа|словосполуч/.test(text)) return topic(subject, 4, 0);
    if (/просте реченн|синтакс/.test(text)) return topic(subject, 4, 2);
    if (/словосполучення відповідає|редагув/.test(text)) return topic(subject, 5, 1);
    if (/стиліст/.test(text)) return topic(subject, 5, 0);
    if (/офіційний лист|мовленнєва ситуац/.test(text)) return topic(subject, 6, 2);
    if (/логічн.*послідов|зв’язн|точність мовлення/.test(text)) return topic(subject, 6, 1);
    return topic(subject, 6, 0);
  }
  if (subject === "mathematics") {
    if (/текстов.*задач/.test(text)) return topic(subject, 0, 6);
    if (/відсот|пропорц|масштаб/.test(text)) return topic(subject, 0, 1);
    if (/раціональн.*вираз/.test(text)) return topic(subject, 0, 2);
    if (/логарифмічн.*вираз/.test(text)) return topic(subject, 0, 4);
    if (/тригонометричн.*вираз/.test(text)) return topic(subject, 0, 5);
    if (/степен|корен/.test(text)) return topic(subject, 0, 3);
    if (/дійсні числа|числа і вирази/.test(text)) return topic(subject, 0, 0);
    if (/квадратн.*рівнян/.test(text)) return topic(subject, 1, 1);
    if (/раціональн.*рівнян/.test(text)) return topic(subject, 1, 2);
    if (/ірраціональн.*рівнян/.test(text)) return topic(subject, 1, 3);
    if (/показников.*рівнян/.test(text)) return topic(subject, 1, 4);
    if (/логарифмічн.*рівнян/.test(text)) return topic(subject, 1, 5);
    if (/тригонометричн.*рівнян/.test(text)) return topic(subject, 1, 6);
    if (/нерівност|систем/.test(text)) return topic(subject, 1, 7);
    if (/рівнян/.test(text)) return topic(subject, 1, 0);
    if (/послідовн|прогресі/.test(text)) return topic(subject, 2, 1);
    if (/похідн/.test(text)) return topic(subject, 2, 2);
    if (/первісн|інтеграл/.test(text)) return topic(subject, 2, 3);
    if (/функц|графік/.test(text)) return topic(subject, 2, 0);
    if (/ймовір/.test(text)) return topic(subject, 3, 1);
    if (/статист|середн/.test(text)) return topic(subject, 3, 2);
    if (/комбінатор/.test(text)) return topic(subject, 3, 0);
    if (/трикут/.test(text)) return topic(subject, 4, 1);
    if (/чотирикут|прямокут|многокут/.test(text)) return topic(subject, 4, 2);
    if (/коло|круг/.test(text)) return topic(subject, 4, 3);
    if (/величин|площ|довжин/.test(text)) return topic(subject, 4, 4);
    if (/планіметр|кут|координат.*площин/.test(text)) return topic(subject, 4, 0);
    if (/прямі та площини|простор/.test(text)) return topic(subject, 5, 0);
    if (/многогран|призм|пірамід/.test(text)) return topic(subject, 5, 1);
    if (/тіла обертання|циліндр|конус|куля/.test(text)) return topic(subject, 5, 2);
    return topic(subject, 5, 3);
  }
  if (subject === "english") {
    if (/пошук інформації|specific information/.test(text)) return topic(subject, 0, 1);
    if (/детальне|detailed/.test(text)) return topic(subject, 0, 2);
    if (/структур|зв’язки|cohesion/.test(text)) return topic(subject, 0, 3);
    if (/читання|reading/.test(text)) return topic(subject, 0, 0);
    if (/closest in meaning|word closest/.test(promptText) || /знання лексики/.test(text)) return topic(subject, 1, 0);
    if (/complete.*phrase|make a ___|collocation/.test(promptText)) return topic(subject, 1, 1);
    if (/if i|conditional|modal/.test(promptText)) return topic(subject, 1, 3);
    if (/by millions|passive/.test(promptText)) return topic(subject, 1, 4);
    if (/look forward|gerund|infinitive/.test(promptText)) return topic(subject, 1, 5);
    if (/neither|pronoun|agreement/.test(promptText)) return topic(subject, 1, 6);
    if (/than the|adjective|comparison/.test(promptText)) return topic(subject, 1, 7);
    if (/arrived ___|preposition|article|linker/.test(promptText)) return topic(subject, 1, 8);
    return topic(subject, 1, 2);
  }
  if (subject === "german") {
    if (/gezielte|informationssuche/.test(text)) return topic(subject, 0, 1);
    if (/detailliert/.test(text)) return topic(subject, 0, 2);
    if (/textaufbau|kohärenz|lücken/.test(text)) return topic(subject, 0, 3);
    if (/читання|lesen|bibliothek/.test(text)) return topic(subject, 0, 0);
    if (/dasselbe|wortschatz/.test(promptText)) return topic(subject, 1, 0);
    if (/verbindung|entscheidung ___/.test(promptText)) return topic(subject, 1, 1);
    if (/wenn ich|konjunktiv|beding/.test(promptText)) return topic(subject, 1, 3);
    if (/weiß nicht|nachdem|nebensatz|wortstellung/.test(promptText)) return topic(subject, 1, 4);
    if (/relativ|der mann/.test(promptText)) return topic(subject, 1, 5);
    if (/pronomen|kongruenz/.test(promptText)) return topic(subject, 1, 6);
    if (/als der|adjektiv|steigerung/.test(promptText)) return topic(subject, 1, 7);
    if (/interessiert sich|fahren morgen|präposition|artikel/.test(promptText)) return topic(subject, 1, 8);
    return topic(subject, 1, 2);
  }
  if (subject === "biology") {
    if (/хімічний склад|мономер|білка/.test(text)) return topic(subject, 0, 0);
    if (/прокаріотичної клітини/.test(text)) return topic(subject, 0, 1);
    if (/еукаріот|органела/.test(text)) return topic(subject, 0, 2);
    if (/фотосинтез|клітинне дихання/.test(text)) return topic(subject, 0, 4);
    if (/обмін речовин|перетворення енергії/.test(text)) return topic(subject, 0, 3);
    if (/реалізаці.*спадков|синтезу рнк|трансляц/.test(text)) return topic(subject, 0, 5);
    if (/поділ клітин|клітинний цикл/.test(text)) return topic(subject, 0, 6);
    if (/хромосомн.*теор/.test(text)) return topic(subject, 1, 2);
    if (/мінлив/.test(text)) return topic(subject, 1, 3);
    if (/генетика людини/.test(text)) return topic(subject, 1, 4);
    if (/селекц|біотехнолог/.test(text)) return topic(subject, 1, 5);
    if (/алель|закономірності спадков/.test(text)) return topic(subject, 1, 1);
    if (/генотип|сукупність усіх генів|поняття генетики/.test(text)) return topic(subject, 1, 0);
    if (/вірус|віроїд|пріон/.test(text)) return topic(subject, 2, 1);
    if (/прокаріот/.test(text)) return topic(subject, 2, 2);
    if (/одноклітин|евглен/.test(text)) return topic(subject, 2, 3);
    if (/гриб/.test(text)) return topic(subject, 2, 4);
    if (/вегетативн.*орган/.test(text)) return topic(subject, 2, 5);
    if (/генеративн|подвійне запліднення|розмноження рослин/.test(text)) return topic(subject, 2, 6);
    if (/різноманітність рослин/.test(text)) return topic(subject, 2, 7);
    if (/поведінк|адаптац.*тварин/.test(text)) return topic(subject, 2, 10);
    if (/різноманітн.*тварин/.test(text)) return topic(subject, 2, 9);
    if (/тварин/.test(text)) return topic(subject, 2, 8);
    if (/систематик|біорізноманіт/.test(text)) return topic(subject, 2, 0);
    if (/опорно-рух/.test(text)) return topic(subject, 3, 0);
    if (/клітини крові|внутрішнє середовище|кров\. лімфа/.test(text)) return topic(subject, 3, 1);
    if (/кровоносн|лімфатичн/.test(text)) return topic(subject, 3, 2);
    if (/газообмін|дихан/.test(text)) return topic(subject, 3, 3);
    if (/травл/.test(text)) return topic(subject, 3, 4);
    if (/сечовид|нирк|виділення/.test(text)) return topic(subject, 3, 5);
    if (/нервов/.test(text)) return topic(subject, 3, 6);
    if (/гормон|гуморальн|інсулін/.test(text)) return topic(subject, 3, 7);
    if (/сенсорн/.test(text)) return topic(subject, 3, 8);
    if (/репродук|розвиток людини/.test(text)) return topic(subject, 3, 9);
    if (/екологічн.*чинник/.test(text)) return topic(subject, 4, 0);
    if (/популяц|угрупован/.test(text)) return topic(subject, 4, 1);
    if (/екосистем|ланцюг.*живлення/.test(text)) return topic(subject, 4, 2);
    if (/біосфер|охорона природи/.test(text)) return topic(subject, 4, 3);
    if (/адаптац/.test(text)) return topic(subject, 4, 4);
    return topic(subject, 4, 5);
  }
  if (subject === "geography") {
    if (/форма і розміри|рухи.*земл/.test(text)) return topic(subject, 0, 1);
    if (/координат/.test(text) && !/прямокутн/.test(text)) return topic(subject, 0, 2);
    if (/масштаб|відстан.*карт/.test(text)) return topic(subject, 0, 3);
    if (/азимут|орієнтуван/.test(text)) return topic(subject, 0, 4);
    if (/топограф|абсолютна висота|відносна висота/.test(text)) return topic(subject, 0, 5);
    if (/літосфер|рельєф/.test(text)) return topic(subject, 0, 6);
    if (/атмосфер|клімат/.test(text)) return topic(subject, 0, 7);
    if (/гідросфер/.test(text)) return topic(subject, 0, 8);
    if (/географічна оболонка|біосфер/.test(text)) return topic(subject, 0, 9);
    if (/географічн.*дослідж/.test(text)) return topic(subject, 0, 0);
    if (/океан/.test(text)) return topic(subject, 1, 0);
    if (/африк|кіліманджаро/.test(text)) return topic(subject, 1, 1);
    if (/австрал|океанія/.test(text)) return topic(subject, 1, 2);
    if (/південн.*америк|атакама/.test(text)) return topic(subject, 1, 3);
    if (/північн.*америк/.test(text)) return topic(subject, 1, 4);
    if (/антарктид/.test(text)) return topic(subject, 1, 5);
    if (/євраз|європ|азі/.test(text)) return topic(subject, 1, 6);
    if (/материк/.test(text)) return topic(subject, 1, 7);
    if (/тектонічн.*украї|рельєф.*украї/.test(text)) return topic(subject, 2, 1);
    if (/клімат.*украї|кліматичні ресурси/.test(text)) return topic(subject, 2, 2);
    if (/води суходолу|річк|озеро/.test(text)) return topic(subject, 2, 3);
    if (/ґрунт|рослинність|тваринний світ/.test(text)) return topic(subject, 2, 4);
    if (/ландшафт|природні комплекси/.test(text)) return topic(subject, 2, 5);
    if (/природокористув|природн.*ресурс/.test(text)) return topic(subject, 2, 6);
    if (/фізична географія україни|вершина україни|географічне положення україни/.test(text)) return topic(subject, 2, 0);
    if (/статево-віков|етніч|мовна сім/.test(text)) return topic(subject, 3, 1);
    if (/міграц/.test(text)) return topic(subject, 3, 2);
    if (/розселен|густота/.test(text)) return topic(subject, 3, 3);
    if (/урбаніза|міського населення/.test(text)) return topic(subject, 3, 4);
    if (/ринок праці|демографічна політика/.test(text)) return topic(subject, 3, 5);
    if (/населен|природний приріст|демограф/.test(text)) return topic(subject, 3, 0);
    if (/сільське господар|первинн.*сектор/.test(text)) return topic(subject, 4, 1);
    if (/видобув|вугіл|руд метал/.test(text)) return topic(subject, 4, 2);
    if (/енергет|електроенер|аес|відновлюван.*джерел/.test(text)) return topic(subject, 4, 3);
    if (/металург/.test(text)) return topic(subject, 4, 4);
    if (/хімічн.*промисл/.test(text)) return topic(subject, 4, 5);
    if (/машинобуд|автомобілебуд/.test(text)) return topic(subject, 4, 6);
    if (/харчов|легк.*промисл/.test(text)) return topic(subject, 4, 7);
    if (/транспорт|третинн.*сектор/.test(text)) return topic(subject, 4, 8);
    if (/тнк|транснаціон|міжнародн.*поділ|спеціалізація країни/.test(text)) return topic(subject, 4, 9);
    if (/господарств|економік|виробництв/.test(text)) return topic(subject, 4, 0);
    if (/міжнародн.*туризм/.test(text)) return topic(subject, 5, 6);
    if (/німеччин|європ/.test(text)) return topic(subject, 5, 1);
    if (/коре|япон|азі|держава-архіпелаг/.test(text)) return topic(subject, 5, 2);
    if (/канад|америк/.test(text)) return topic(subject, 5, 3);
    if (/африк/.test(text)) return topic(subject, 5, 4);
    if (/австрал|океанія/.test(text)) return topic(subject, 5, 5);
    if (/політична карта|типізація країн|країна європи/.test(text)) return topic(subject, 5, 0);
    if (/парников|зміна клімат/.test(text)) return topic(subject, 6, 0);
    if (/лісів амазон|виснаження ресурс/.test(text)) return topic(subject, 6, 1);
    if (/забруднен/.test(text)) return topic(subject, 6, 2);
    return topic(subject, 6, 3);
  }
  return { sectionName: sourceTopic, topicName: sourceTopic };
}

const preparedSubjects = new Set<string>();

export async function ensureSubjectSeeded(db: D1Database, subject: string) {
  const catalog = subjectCatalog.get(subject);
  if (!catalog) return false;
  if (preparedSubjects.has(subject)) return true;
  const records = allQuestionRecords.filter((record) => record.subject === subject);
  const state = await db.prepare("SELECT bank_version FROM subjects WHERE slug=?1").bind(subject).first<{ bank_version: number }>();
  const count = await db.prepare("SELECT COUNT(*) AS count FROM questions WHERE subject_slug=?1").bind(subject).first<{ count: number }>();
  if (state?.bank_version === QUESTION_BANK_VERSION && (count?.count ?? 0) === records.length) {
    preparedSubjects.add(subject);
    return true;
  }
  await db.prepare(`INSERT INTO subjects (slug, name, exam_question_count, required, position, bank_version) VALUES (?1, ?2, ?3, ?4, ?5, 0)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name, exam_question_count=excluded.exam_question_count, required=excluded.required, position=excluded.position`).bind(subject, catalog.name, catalog.examQuestionCount, catalog.required, catalog.position).run();
  const taxonomyTopics = topicTaxonomy[subject].flatMap((section, sectionIndex) => section.topics.map((topicName, topicIndex) => ({ sectionName: section.name, topicName, position: sectionIndex * 100 + topicIndex })));
  const topicStatements = [
    ...taxonomyTopics.map((entry) => db.prepare(`INSERT INTO topics (subject_slug, name, section_name, position) VALUES (?1, ?2, ?3, ?4)
      ON CONFLICT(subject_slug, name) DO UPDATE SET section_name=excluded.section_name, position=excluded.position`).bind(subject, entry.topicName, entry.sectionName, entry.position)),
    db.prepare(`INSERT INTO topics (subject_slug, name, section_name, position) VALUES (?1, ?2, ?2, 9999)
      ON CONFLICT(subject_slug, name) DO UPDATE SET section_name=excluded.section_name, position=excluded.position`).bind(subject, OUTSIDE_PROGRAM),
  ];
  for (let offset = 0; offset < topicStatements.length; offset += 50) await db.batch(topicStatements.slice(offset, offset + 50));
  const rows = await db.prepare("SELECT id, name FROM topics WHERE subject_slug=?1").bind(subject).all<{ id: number; name: string }>();
  const topicIds = new Map(rows.results.map((entry) => [entry.name, entry.id]));
  const questionStatements = records.map((record) => {
    const classification = classifyQuestion(subject, record.topic, record.prompt);
    return db.prepare(`INSERT INTO questions (id, external_id, subject_slug, topic_id, year, session, position, question_type, prompt, options_json, correct_answer, explanation, images_json, source_url, official_pdf_url, attribution)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
      ON CONFLICT(id) DO UPDATE SET external_id=excluded.external_id, topic_id=excluded.topic_id, question_type=excluded.question_type, prompt=excluded.prompt, options_json=excluded.options_json, correct_answer=excluded.correct_answer, explanation=excluded.explanation, images_json=excluded.images_json, source_url=excluded.source_url, official_pdf_url=excluded.official_pdf_url, attribution=excluded.attribution`)
      .bind(record.id, record.external_id, subject, topicIds.get(classification.topicName), record.year, record.session, record.position, record.question_type, record.prompt, JSON.stringify(record.options), record.correct_answer, record.explanation, JSON.stringify(record.images), record.source_url, record.official_pdf_url, record.attribution);
  });
  for (let offset = 0; offset < questionStatements.length; offset += 50) await db.batch(questionStatements.slice(offset, offset + 50));
  await db.prepare("UPDATE subjects SET bank_version=?1 WHERE slug=?2").bind(QUESTION_BANK_VERSION, subject).run();
  preparedSubjects.add(subject);
  return true;
}
