export type SubjectCode = "ukrainian" | "mathematics" | "history" | "english" | "german" | "biology" | "geography";

export interface StudentProfile {
  id: string;
  displayName: string;
  targetScore: number;
}

export interface TestResult {
  id: string;
  userId: string;
  subject: SubjectCode;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: string;
}

export interface DashboardStats {
  averageScore: number;
  completedTests: number;
  studyStreakDays: number;
  weeklyProgress: number;
}

// Контракти профілю й результатів готові для наступного кроку авторизації.
