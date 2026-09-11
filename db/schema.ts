import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, uniqueIndex, index, primaryKey } from "drizzle-orm/sqlite-core";

export const subjects = sqliteTable("subjects", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  examQuestionCount: integer("exam_question_count").notNull(),
  required: integer("required").notNull().default(0),
  position: integer("position").notNull(),
  bankVersion: integer("bank_version").notNull().default(0),
});

export const topics = sqliteTable("topics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subjectSlug: text("subject_slug").notNull().references(() => subjects.slug),
  name: text("name").notNull(),
  sectionName: text("section_name").notNull().default(""),
  position: integer("position").notNull().default(0),
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

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  targetScore: integer("target_score").notNull().default(180),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const testAttempts = sqliteTable("test_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId),
  subjectSlug: text("subject_slug").notNull().references(() => subjects.slug),
  startedAt: text("started_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
  totalQuestions: integer("total_questions").notNull(),
  correctAnswers: integer("correct_answers").notNull().default(0),
  score: integer("score"),
}, (table) => ({
  userCompleted: index("idx_test_attempts_user_completed").on(table.userId, table.completedAt),
  userSubject: index("idx_test_attempts_user_subject").on(table.userId, table.subjectSlug),
}));

export const attemptQuestions = sqliteTable("attempt_questions", {
  attemptId: text("attempt_id").notNull().references(() => testAttempts.id),
  questionId: text("question_id").notNull().references(() => questions.id),
  position: integer("position").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.attemptId, table.questionId] }),
}));

export const attemptAnswers = sqliteTable("attempt_answers", {
  attemptId: text("attempt_id").notNull().references(() => testAttempts.id),
  questionId: text("question_id").notNull().references(() => questions.id),
  selectedAnswer: text("selected_answer").notNull(),
  isCorrect: integer("is_correct").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.attemptId, table.questionId] }),
}));

export const studyDays = sqliteTable("study_days", {
  userId: text("user_id").notNull().references(() => profiles.userId),
  studyDate: text("study_date").notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.studyDate] }),
}));
