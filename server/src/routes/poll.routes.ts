import { Router } from 'express';
import { pollController } from '../controllers/poll.controller';

/**
 * Poll routes
 * PROD:
 * - Add authentication middleware
 * - Add rate limiting per route
 * - Add request validation middleware
 * - Implement API versioning (v1, v2)
 */

const router = Router();

// Health check
router.get('/health', pollController.healthCheck);

// Poll management
router.get('/polls', pollController.getAllPolls);
router.get('/polls/:pollId', pollController.getPoll);
router.get('/polls/:pollId/results', pollController.getPollResults);
router.get('/polls/:pollId/history', pollController.getPollHistory);
router.get('/polls/:pollId/stats', pollController.getPollStats);
router.delete('/polls/:pollId', pollController.deletePoll);

// PROD: Add these routes with proper validation middleware
// router.post('/polls', validateRequest(createPollSchema), pollController.createPoll);
// router.post('/polls/:pollId/questions', validateRequest(startQuestionSchema), pollController.startQuestion);
// router.post('/polls/:pollId/answers', validateRequest(submitAnswerSchema), pollController.submitAnswer);

export default router;