export type SubjectCode = "ukrainian" | "math" | "history" | "english";

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

// UI працює на демо-даних. Ці контракти стануть межею для Supabase-запитів
// на наступному етапі без перебудови компонентів кабінету.
