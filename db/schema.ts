import { integer, sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const subjects = sqliteTable("subjects", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  examQuestionCount: integer("exam_question_count").notNull(),
  required: integer("required").notNull().default(0),
  position: integer("position").notNull(),
});

export const topics = sqliteTable("topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subjectSlug: text("subject_slug").notNull().references(() => subjects.slug),
  name: text("name").notNull(),
}, (table) => ({
  subjectName: uniqueIndex("topics_subject_name").on(table.subjectSlug, table.name),
}));

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  externalId: text("external_id").notNull(),
  subjectSlug: text("subject_slug").notNull().references(() => subjects.slug),
  topicId: integer("topic_id").notNull().references(() => topics.id),
  year: integer("year").notNull(),
  session: integer("session").notNull(),
  position: integer("position").notNull(),
  questionType: text("question_type").notNull(),
  prompt: text("prompt").notNull(),
  optionsJson: text("options_json").notNull().default("[]"),
  correctAnswer: text("correct_answer").notNull().default(""),
  explanation: text("explanation").notNull().default(""),
  imagesJson: text("images_json").notNull().default("[]"),
  sourceUrl: text("source_url").notNull(),
  officialPdfUrl: text("official_pdf_url").notNull(),
  attribution: text("attribution").notNull(),
}, (table) => ({
  subjectTopic: index("questions_subject_topic").on(table.subjectSlug, table.topicId),
  subjectSessionPosition: index("questions_subject_session_position").on(table.subjectSlug, table.session, table.position),
}));
