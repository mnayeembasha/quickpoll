import { Server } from 'socket.io';
import logger from '../utils/logger';
import { SOCKET_EVENTS } from '../utils/constants';
import { pollStore } from '../models/poll.model';

/**
 * Timer service for managing poll timeouts
 * PROD:
 * - Use Redis pub/sub for distributed timer management
 * - Implement timer persistence for server restarts
 * - Add graceful shutdown to clear all timers
 */

class TimerService {
  private io: Server | null = null;

  setSocketIO(io: Server) {
    this.io = io;
  }

  /**
   * Start a timer for a question
   */
  startTimer(pollId: string, questionId: string, timeout: number): NodeJS.Timeout {
    logger.info('Starting timer', { pollId, questionId, timeout });

    const timerHandle = setTimeout(() => {
      this.onTimerExpired(pollId, questionId);
    }, timeout * 1000);

    return timerHandle;
  }

  /**
   * Clear a timer
   */
  clearTimer(timerHandle: NodeJS.Timeout) {
    clearTimeout(timerHandle);
  }

  /**
   * Handle timer expiration
   */
  private onTimerExpired(pollId: string, questionId: string) {
    logger.info('Timer expired', { pollId, questionId });

    const poll = pollStore.getPoll(pollId);
    if (!poll || !poll.currentQuestion) {
      return;
    }

    // Ensure we're expiring the correct question
    if (poll.currentQuestion.id !== questionId) {
      logger.warn('Timer expired for old question', { pollId, questionId });
      return;
    }

    // Calculate results
    const results = this.calculateResults(pollId);

    // Save to history
    poll.questionHistory.push({
      questionId: poll.currentQuestion.id,
      question: poll.currentQuestion.text,
      options: poll.currentQuestion.options,
      totalResponses: results.totalResponses,
      timestamp: new Date(),
      participants: results.participants,
    });

    // Clear current question
    poll.currentQuestion = null;
    poll.status = 'waiting';

    // Reset student answer status for next question
    poll.students.forEach((student, socketId) => {
      pollStore.updateStudent(pollId, socketId, { hasAnswered: false, answer: undefined });
    });

    // Broadcast time up and results
    if (this.io) {
      this.io.to(pollId).emit(SOCKET_EVENTS.TIME_UP);
      this.io.to(pollId).emit(SOCKET_EVENTS.SHOW_RESULTS, {
        results: results.options,
        totalResponses: results.totalResponses,
        participants: results.participants,
      });
    }

    logger.info('Poll results sent after timeout', { pollId, results });
  }

  /**
   * Calculate poll results
   */
  calculateResults(pollId: string) {
    const poll = pollStore.getPoll(pollId);
    if (!poll || !poll.currentQuestion) {
      return {
        options: [],
        totalResponses: 0,
        participants: [],
      };
    }

    // Count votes
    const voteCounts = new Map<string, number>();
    const participants: string[] = [];

    poll.students.forEach(student => {
      if (student.hasAnswered && student.answer) {
        voteCounts.set(student.answer, (voteCounts.get(student.answer) || 0) + 1);
        participants.push(student.name);
      }
    });

    // Update option votes
    const updatedOptions = poll.currentQuestion.options.map(option => ({
      ...option,
      votes: voteCounts.get(option.id) || 0,
    }));

    return {
      options: updatedOptions,
      totalResponses: participants.length,
      participants,
    };
  }

  /**
   * Check if all students have answered
   */
  checkAllAnswered(pollId: string): boolean {
    const poll = pollStore.getPoll(pollId);
    if (!poll || poll.students.size === 0) {
      return false;
    }

    // Check if all students have answered
    for (const student of poll.students.values()) {
      if (!student.hasAnswered) {
        return false;
      }
    }

    return true;
  }

  /**
   * End question early (when all students answered)
   */
  endQuestionEarly(pollId: string) {
    const poll = pollStore.getPoll(pollId);
    if (!poll || !poll.currentQuestion) {
      return;
    }

    logger.info('Ending question early - all students answered', { pollId });

    // Clear the timer
    if (poll.currentQuestion.timerHandle) {
      this.clearTimer(poll.currentQuestion.timerHandle);
    }

    // Get current question ID before we clear it
    const questionId = poll.currentQuestion.id;

    // Trigger the timer expired logic
    this.onTimerExpired(pollId, questionId);
  }
}

export const timerService = new TimerService();
export default timerService;