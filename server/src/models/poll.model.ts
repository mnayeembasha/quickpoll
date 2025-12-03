/**
 * Data models and in-memory storage
 * PROD: Replace with proper database (MongoDB, PostgreSQL, Redis)
 * - Use Redis for real-time data (active polls, sessions)
 * - Use MongoDB/PostgreSQL for persistent data (poll history)
 * - Implement proper data persistence and recovery
 */

export interface Student {
  socketId: string;
  name: string;
  joinedAt: Date;
  hasAnswered: boolean;
  answer?: string;
}

export interface Option {
  id: string;
  text: string;
  votes: number;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  startedAt: Date;
  timeout: number; // in seconds
  timerHandle?: NodeJS.Timeout;
}

export interface Poll {
  id: string;
  teacherSocketId: string;
  students: Map<string, Student>; // socketId -> Student
  currentQuestion: Question | null;
  questionHistory: QuestionResult[];
  createdAt: Date;
  status: 'waiting' | 'active' | 'ended';
  chatMessages: ChatMessage[]; // Bonus feature
}

export interface QuestionResult {
  questionId: string;
  question: string;
  options: Option[];
  totalResponses: number;
  timestamp: Date;
  participants: string[]; // student names who participated
}

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'teacher' | 'student';
  message: string;
  timestamp: Date;
}

/**
 * In-memory storage
 * PROD: Replace with Redis or similar for distributed systems
 * - Implement data sharding for scalability
 * - Add data expiration policies
 * - Implement backup/restore mechanisms
 */
class PollStore {
  private polls: Map<string, Poll>;
  private teacherToPoll: Map<string, string>; // teacherSocketId -> pollId
  private studentToPoll: Map<string, string>; // studentSocketId -> pollId

  constructor() {
    this.polls = new Map();
    this.teacherToPoll = new Map();
    this.studentToPoll = new Map();
  }

  createPoll(pollId: string, teacherSocketId: string): Poll {
    const poll: Poll = {
      id: pollId,
      teacherSocketId,
      students: new Map(),
      currentQuestion: null,
      questionHistory: [],
      createdAt: new Date(),
      status: 'waiting',
      chatMessages: [],
    };

    this.polls.set(pollId, poll);
    this.teacherToPoll.set(teacherSocketId, pollId);
    return poll;
  }

  getPoll(pollId: string): Poll | undefined {
    return this.polls.get(pollId);
  }

  getPollByTeacher(teacherSocketId: string): Poll | undefined {
    const pollId = this.teacherToPoll.get(teacherSocketId);
    return pollId ? this.polls.get(pollId) : undefined;
  }

  getPollByStudent(studentSocketId: string): Poll | undefined {
    const pollId = this.studentToPoll.get(studentSocketId);
    return pollId ? this.polls.get(pollId) : undefined;
  }

  addStudent(pollId: string, student: Student): void {
    const poll = this.polls.get(pollId);
    if (poll) {
      poll.students.set(student.socketId, student);
      this.studentToPoll.set(student.socketId, pollId);
    }
  }

  removeStudent(pollId: string, socketId: string): void {
    const poll = this.polls.get(pollId);
    if (poll) {
      poll.students.delete(socketId);
      this.studentToPoll.delete(socketId);
    }
  }

  updateStudent(pollId: string, socketId: string, updates: Partial<Student>): void {
    const poll = this.polls.get(pollId);
    if (poll && poll.students.has(socketId)) {
      const student = poll.students.get(socketId)!;
      poll.students.set(socketId, { ...student, ...updates });
    }
  }

  deletePoll(pollId: string): void {
    const poll = this.polls.get(pollId);
    if (poll) {
      // Clear timer if exists
      if (poll.currentQuestion?.timerHandle) {
        clearTimeout(poll.currentQuestion.timerHandle);
      }
      
      // Clean up mappings
      this.teacherToPoll.delete(poll.teacherSocketId);
      poll.students.forEach((_, socketId) => {
        this.studentToPoll.delete(socketId);
      });
      
      this.polls.delete(pollId);
    }
  }

  // PROD: Implement cleanup for inactive polls
  cleanupInactivePolls(maxAgeHours: number = 24): number {
    const now = new Date().getTime();
    const maxAge = maxAgeHours * 60 * 60 * 1000;
    let cleaned = 0;

    this.polls.forEach((poll, pollId) => {
      const age = now - poll.createdAt.getTime();
      if (age > maxAge) {
        this.deletePoll(pollId);
        cleaned++;
      }
    });

    return cleaned;
  }

  getAllPolls(): Poll[] {
    return Array.from(this.polls.values());
  }

  getActivePolls(): Poll[] {
    return Array.from(this.polls.values()).filter(p => p.status === 'active');
  }

  getStats() {
    return {
      totalPolls: this.polls.size,
      activePolls: this.getActivePolls().length,
      totalStudents: this.studentToPoll.size,
      totalTeachers: this.teacherToPoll.size,
    };
  }
}

// Singleton instance
export const pollStore = new PollStore();

// PROD: Export store instance for testing/mocking
export default pollStore;