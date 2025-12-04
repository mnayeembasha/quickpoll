
export interface Student {
  name: string;
  hasAnswered: boolean;
  joinedAt: string;
}

export interface Option {
  id: string;
  text: string;
  votes?: number;
}

export interface Question {
  questionId: string;
  question: string;
  options: Option[];
  timeout: number;
  startedAt: string;
}

export interface PollResults {
  options: Option[];
  totalResponses: number;
  participants: string[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'teacher' | 'student';
  message: string;
  timestamp: Date;
}