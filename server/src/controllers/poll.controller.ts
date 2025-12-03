import { type Request, type Response } from 'express';
import { pollService } from '../services/poll.service';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

/**
 * REST API Controllers
 * PROD:
 * - Add authentication middleware
 * - Implement proper authorization checks
 * - Add request/response logging
 * - Implement API versioning
 * - Add response compression
 */

class PollController {
  /**
   * Health check endpoint
   */
  healthCheck = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
    });
  });

  /**
   * Get poll by ID
   * GET /api/polls/:pollId
   */
  getPoll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { pollId } = req.params;
    
    if (!pollId) {
      res.status(400).json({
        success: false,
        error: 'Poll ID is required',
      });
      return;
    }
    
    const poll = pollService.getPoll(pollId);

    res.json({
      success: true,
      data: {
        pollId: poll.id,
        status: poll.status,
        totalStudents: poll.students.size,
        students: Array.from(poll.students.values()).map(s => ({
          name: s.name,
          hasAnswered: s.hasAnswered,
          joinedAt: s.joinedAt,
        })),
        currentQuestion: poll.currentQuestion ? {
          id: poll.currentQuestion.id,
          text: poll.currentQuestion.text,
          options: poll.currentQuestion.options,
          startedAt: poll.currentQuestion.startedAt,
          timeout: poll.currentQuestion.timeout,
        } : null,
        createdAt: poll.createdAt,
      },
    });
  });

  /**
   * Get poll results
   * GET /api/polls/:pollId/results
   */
  getPollResults = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { pollId } = req.params;
    
    if (!pollId) {
      res.status(400).json({
        success: false,
        error: 'Poll ID is required',
      });
      return;
    }
    
    const results = pollService.getPollResults(pollId);

    res.json({
      success: true,
      data: results,
    });
  });

  /**
   * Get poll history
   * GET /api/polls/:pollId/history
   */
  getPollHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { pollId } = req.params;
    
    if (!pollId) {
      res.status(400).json({
        success: false,
        error: 'Poll ID is required',
      });
      return;
    }
    
    const history = pollService.getPollHistory(pollId);

    res.json({
      success: true,
      data: {
        pollId,
        totalQuestions: history.length,
        history,
      },
    });
  });

  /**
   * Get poll statistics
   * GET /api/polls/:pollId/stats
   */
  getPollStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { pollId } = req.params;
    
    if (!pollId) {
      res.status(400).json({
        success: false,
        error: 'Poll ID is required',
      });
      return;
    }
    
    const stats = pollService.getPollStats(pollId);

    res.json({
      success: true,
      data: stats,
    });
  });

  /**
   * Get all polls (admin/monitoring)
   * GET /api/polls
   * PROD: Add authentication, pagination, filtering
   */
  getAllPolls = asyncHandler(async (req: Request, res: Response) => {
    const polls = pollService.getAllPolls();

    res.json({
      success: true,
      data: {
        total: polls.length,
        polls,
      },
    });
  });

  /**
   * Delete poll
   * DELETE /api/polls/:pollId
   * PROD: Add authentication, only allow teacher to delete their poll
   */
  deletePoll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { pollId } = req.params;
    
    if (!pollId) {
      res.status(400).json({
        success: false,
        error: 'Poll ID is required',
      });
      return;
    }
    
    pollService.deletePoll(pollId);

    logger.info('Poll deleted via API', { pollId });

    res.json({
      success: true,
      data: {
        message: 'Poll deleted successfully',
      },
    });
  });
}

export const pollController = new PollController();
export default pollController;