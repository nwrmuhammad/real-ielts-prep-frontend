export type Tariff = "XAVASKOR" | "AMATEUR" | "ERKATOY";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  tariff: Tariff;
  tariffExpiresAt?: string | null;
  createdAt?: string;
}

export type QuestionType =
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE_NG"
  | "FILL_IN_BLANK"
  | "MATCHING_HEADINGS"
  | "MATCHING_INFO"
  | "SHORT_ANSWER";

export interface Question {
  id: string;
  passageId: string;
  order: number;
  type: QuestionType;
  questionText: string;
  instruction?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
}

export interface Passage {
  id: string;
  testId: string;
  order: number;
  title: string;
  content: string;
  questions: Question[];
}

export type TestStatus = "FREE" | "PREDICTED";

export interface Test {
  id: string;
  title: string;
  description?: string;
  timeLimit: number;
  isPublished: boolean;
  status: TestStatus;
  passageCategory?: number | null;
  passages?: Passage[];
  _count?: { passages: number; testResults: number };
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string;
  userAnswer: string | null;
  isCorrect: boolean;
  question?: Question & { passage?: { title: string; order: number } };
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  startedAt: string;
  submittedAt?: string;
  timeSpent?: number;
  rawScore: number;
  totalPoints: number;
  bandScore?: number;
  completed: boolean;
  test?: { id: string; title: string };
  answers?: Answer[];
}
