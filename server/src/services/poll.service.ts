import { nanoid } from 'nanoid';
import { pollStore, type Poll, type Student, type Question, type QuestionResult } from '../models/poll.model';
import { ERROR_MESSAGES, LIMITS } from '../utils/constants';
import { AppError } from '../middleware/error.middleware';
import logger from '../utils/logger';

/**
 * Poll service - Business logic layer
 * PROD:
 * - Add transaction support for database operations
 * - Implement caching layer (Redis)
 * - Add metrics tracking (poll creation rate, completion rate, etc.)
 * - Implement data archival strategy
 */

class PollService {
  /**
   * Create a new poll
   */
  createPoll(teacherSocketId: string): Poll {
    // Check if teacher already has an active poll
    // PROD: Allow multiple polls per teacher with proper management
    const existingPoll = pollStore.getPollByTeacher(teacherSocketId);
    if (existingPoll) {
      logger.warn('Teacher already has an active poll', { teacherSocketId });
      throw new AppError('You already have an active poll', 400);
    }

    const pollId = nanoid(10); // Generate unique poll ID
    const poll = pollStore.createPoll(pollId, teacherSocketId);

    logger.info('Poll created', { pollId, teacherSocketId });
    return poll;
  }

  /**
   * Get poll by ID
   */
  getPoll(pollId: string): Poll {
    const poll = pollStore.getPoll(pollId);
    if (!poll) {
      throw new AppError(ERROR_MESSAGES.POLL_NOT_FOUND, 404);
    }
    return poll;
  }

  /**
   * Get poll by teacher socket ID
   */
  getPollByTeacher(teacherSocketId: string): Poll | null {
    const poll = pollStore.getPollByTeacher(teacherSocketId);
    return poll || null;
  }

  /**
   * Get poll by student socket ID
   */
  getPollByStudent(studentSocketId: string): Poll | null {
    const poll = pollStore.getPollByStudent(studentSocketId);
    return poll || null;
  }

  /**
   * Add student to poll
   */
  addStudentToPoll(pollId: string, studentSocketId: string, studentName: string): Student {
    const poll = this.getPoll(pollId);

    // Check if poll has reached max capacity
    // PROD: Make this configurable per poll
    if (poll.students.size >= LIMITS.MAX_STUDENTS_PER_POLL) {
      throw new AppError(ERROR_MESSAGES.MAX_STUDENTS_REACHED, 400);
    }

    // Check for duplicate names in the poll
    // PROD: Consider allowing duplicate names with unique IDs
    for (const student of poll.students.values()) {
      if (student.name.toLowerCase() === studentName.toLowerCase()) {
        throw new AppError(ERROR_MESSAGES.DUPLICATE_NAME, 400);
      }
    }

    const student: Student = {
      socketId: studentSocketId,
      name: studentName,
      joinedAt: new Date(),
      hasAnswered: false,
      answer: null,
    };

    pollStore.addStudent(pollId, student);
    logger.info('Student joined poll', { pollId, studentName, studentSocketId });

    return student;
  }

  /**
   * Remove student from poll
   */
  removeStudentFromPoll(pollId: string, studentSocketId: string): void {
    const poll = this.getPoll(pollId);
    
    if (!poll.students.has(studentSocketId)) {
      throw new AppError(ERROR_MESSAGES.STUDENT_NOT_FOUND, 404);
    }

    const studentName = poll.students.get(studentSocketId)!.name;
    pollStore.removeStudent(pollId, studentSocketId);
    
    logger.info('Student removed from poll', { pollId, studentSocketId, studentName });
  }

  /**
   * Start a new question
   */
  startQuestion(pollId: string, questionText: string, options: string[], timeout: number = 60): Question {
    const poll = this.getPoll(pollId);

    // Check if a question is already active
    if (poll.currentQuestion) {
      throw new AppError(ERROR_MESSAGES.POLL_ALREADY_ACTIVE, 400);
    }

    // Create question with options
    const question: Question = {
      id: nanoid(10),
      text: questionText,
      options: options.map((text, index) => ({
        id: `option_${index}`,
        text,
        votes: 0,
      })),
      startedAt: new Date(),
      timeout,
    };

    poll.currentQuestion = question;
    poll.status = 'active';

    // Reset all students' answer status
    poll.students.forEach((student, socketId) => {
      pollStore.updateStudent(pollId, socketId, { hasAnswered: false, answer: null });
    });

    logger.info('Question started', { pollId, questionId: question.id, timeout });
    return question;
  }

  /**
   * Submit answer
   */
  submitAnswer(pollId: string, studentSocketId: string, questionId: string, answer: string): void {
    const poll = this.getPoll(pollId);

    // Check if question is active
    if (!poll.currentQuestion) {
      throw new AppError(ERROR_MESSAGES.POLL_NOT_ACTIVE, 400);
    }

    // Verify question ID matches
    if (poll.currentQuestion.id !== questionId) {
      throw new AppError('Question has changed', 400);
    }

    // Get student
    const student = poll.students.get(studentSocketId);
    if (!student) {
      throw new AppError(ERROR_MESSAGES.STUDENT_NOT_FOUND, 404);
    }

    // Check if already answered
    if (student.hasAnswered) {
      throw new AppError(ERROR_MESSAGES.ALREADY_ANSWERED, 400);
    }

    // Validate answer is a valid option
    const isValidOption = poll.currentQuestion.options.some(opt => opt.id === answer);
    if (!isValidOption) {
      throw new AppError(ERROR_MESSAGES.INVALID_ANSWER, 400);
    }

    // Update student answer
    pollStore.updateStudent(pollId, studentSocketId, {
      hasAnswered: true,
      answer,
    });

    // Update vote count
    const option = poll.currentQuestion.options.find(opt => opt.id === answer);
    if (option) {
      option.votes++;
    }

    logger.info('Answer submitted', { pollId, studentSocketId, questionId, answer });
  }

  /**
   * Get poll results
   */
  getPollResults(pollId: string) {
    const poll = this.getPoll(pollId);

    if (!poll.currentQuestion) {
      throw new AppError(ERROR_MESSAGES.POLL_NOT_ACTIVE, 400);
    }

    const totalResponses = Array.from(poll.students.values()).filter(s => s.hasAnswered).length;
    const participants = Array.from(poll.students.values())
      .filter(s => s.hasAnswered)
      .map(s => s.name);

    return {
      question: poll.currentQuestion.text,
      options: poll.currentQuestion.options,
      totalResponses,
      totalStudents: poll.students.size,
      participants,
    };
  }

  /**
   * Get poll history
   */
  getPollHistory(pollId: string): QuestionResult[] {
    const poll = this.getPoll(pollId);
    return poll.questionHistory;
  }

  /**
   * Get poll statistics
   */
  getPollStats(pollId: string) {
    const poll = this.getPoll(pollId);

    return {
      pollId: poll.id,
      status: poll.status,
      totalStudents: poll.students.size,
      questionsAsked: poll.questionHistory.length,
      currentQuestion: poll.currentQuestion ? {
        text: poll.currentQuestion.text,
        timeRemaining: this.getTimeRemaining(poll),
        responses: Array.from(poll.students.values()).filter(s => s.hasAnswered).length,
      } : null,
      students: Array.from(poll.students.values()).map(s => ({
        name: s.name,
        joinedAt: s.joinedAt,
        hasAnswered: s.hasAnswered,
      })),
    };
  }

  /**
   * Calculate time remaining for current question
   */
  private getTimeRemaining(poll: Poll): number {
    if (!poll.currentQuestion) {
      return 0;
    }

    const elapsed = (Date.now() - poll.currentQuestion.startedAt.getTime()) / 1000;
    const remaining = Math.max(0, poll.currentQuestion.timeout - elapsed);
    return Math.ceil(remaining);
  }

  /**
   * Delete poll
   * PROD: Implement soft delete and archival
   */
  deletePoll(pollId: string): void {
    pollStore.deletePoll(pollId);
    logger.info('Poll deleted', { pollId });
  }

  /**
   * Get all active polls (admin/monitoring)
   * PROD: Add pagination, filtering
   */
  getAllPolls() {
    return pollStore.getAllPolls().map(poll => ({
      id: poll.id,
      status: poll.status,
      studentCount: poll.students.size,
      questionCount: poll.questionHistory.length,
      createdAt: poll.createdAt,
      hasActiveQuestion: !!poll.currentQuestion,
    }));
  }
}

export const pollService = new PollService();
export default pollService;