import { z } from 'zod';
import { LIMITS } from '../utils/constants';

/**
 * Zod validation schemas
 * PROD: 
 * - Add more comprehensive validation rules
 * - Sanitize inputs to prevent XSS
 * - Add custom error messages for better UX
 */

export const createPollSchema = z.object({
  teacherName: z.string()
    .min(1, 'Teacher name is required')
    .max(LIMITS.MAX_NAME_LENGTH, `Name too long (max ${LIMITS.MAX_NAME_LENGTH} chars)`)
    .trim()
    // PROD: Add regex to prevent special characters if needed
    .refine(val => val.length > 0, 'Name cannot be empty'),
});

export const joinPollSchema = z.object({
  pollId: z.string()
    .min(1, 'Poll ID is required')
    .trim(),
  studentName: z.string()
    .min(1, 'Student name is required')
    .max(LIMITS.MAX_NAME_LENGTH, `Name too long (max ${LIMITS.MAX_NAME_LENGTH} chars)`)
    .trim()
    // PROD: Add validation to prevent inappropriate names
    .refine(val => val.length > 0, 'Name cannot be empty'),
});

export const startQuestionSchema = z.object({
  question: z.string()
    .min(1, 'Question is required')
    .max(LIMITS.MAX_QUESTION_LENGTH, `Question too long (max ${LIMITS.MAX_QUESTION_LENGTH} chars)`)
    .trim(),
  options: z.array(
    z.string()
      .min(1, 'Option cannot be empty')
      .max(LIMITS.MAX_OPTION_LENGTH, `Option too long (max ${LIMITS.MAX_OPTION_LENGTH} chars)`)
      .trim()
  )
    .min(2, 'At least 2 options required')
    .max(LIMITS.MAX_OPTIONS_PER_QUESTION, `Max ${LIMITS.MAX_OPTIONS_PER_QUESTION} options allowed`)
    .refine(
      options => new Set(options).size === options.length,
      'Options must be unique'
    ),
  timeout: z.number()
    .int('Timeout must be an integer')
    .min(10, 'Timeout must be at least 10 seconds')
    .max(300, 'Timeout cannot exceed 300 seconds')
    .optional()
    .default(60),
});

export const submitAnswerSchema = z.object({
  questionId: z.string()
    .min(1, 'Question ID is required'),
  answer: z.string()
    .min(1, 'Answer is required')
    .trim(),
});

export const removeStudentSchema = z.object({
  studentSocketId: z.string()
    .min(1, 'Student socket ID is required'),
});

// Bonus feature: Chat validation
export const sendMessageSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(LIMITS.MAX_CHAT_MESSAGE_LENGTH, `Message too long (max ${LIMITS.MAX_CHAT_MESSAGE_LENGTH} chars)`)
    .trim()
    // PROD: Add profanity filter, spam detection
});

/**
 * Generic validation helper
 */
export const validate = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      throw new Error(`Validation error: ${messages.join(', ')}`);
    }
    throw error;
  }
};

/**
 * Express middleware for request validation
 * PROD: Add rate limiting per endpoint
 */
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: any, res: any, next: any) => {
    try {
      req.validatedData = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
};

export type CreatePollInput = z.infer<typeof createPollSchema>;
export type JoinPollInput = z.infer<typeof joinPollSchema>;
export type StartQuestionInput = z.infer<typeof startQuestionSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type RemoveStudentInput = z.infer<typeof removeStudentSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;