/**
 * Application constants
 * PROD: Move sensitive values to environment variables or secret management
 */

export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Poll events
  CREATE_POLL: 'createPoll',
  JOIN_POLL: 'joinPoll',
  LEAVE_POLL: 'leavePoll',
  
  // Teacher events
  START_QUESTION: 'startQuestion',
  END_QUESTION: 'endQuestion',
  REMOVE_STUDENT: 'removeStudent',
  
  // Student events
  SUBMIT_ANSWER: 'submitAnswer',
  
  // Broadcast events
  NEW_QUESTION: 'newQuestion',
  ANSWER_RECEIVED: 'answerReceived',
  TIME_UP: 'timeUp',
  SHOW_RESULTS: 'showResults',
  STUDENT_JOINED: 'studentJoined',
  STUDENT_LEFT: 'studentLeft',
  STUDENT_REMOVED: 'studentRemoved',
  
  // Chat events (Bonus feature)
  SEND_MESSAGE: 'sendMessage',
  NEW_MESSAGE: 'newMessage',
  
  // Error events
  ERROR: 'error',
} as const;

export const POLL_STATUS = {
  WAITING: 'waiting',
  ACTIVE: 'active',
  ENDED: 'ended',
} as const;

export const USER_ROLES = {
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export const ERROR_MESSAGES = {
  POLL_NOT_FOUND: 'Poll not found',
  POLL_ALREADY_ACTIVE: 'A question is already active',
  POLL_NOT_ACTIVE: 'No active question',
  STUDENT_NOT_FOUND: 'Student not found',
  ALREADY_ANSWERED: 'You have already answered this question',
  TIME_EXPIRED: 'Time has expired for this question',
  INVALID_ANSWER: 'Invalid answer provided',
  UNAUTHORIZED: 'Unauthorized action',
  DUPLICATE_NAME: 'A student with this name already exists',
  MAX_STUDENTS_REACHED: 'Maximum number of students reached',
} as const;

export const SUCCESS_MESSAGES = {
  POLL_CREATED: 'Poll created successfully',
  QUESTION_STARTED: 'Question started successfully',
  ANSWER_SUBMITTED: 'Answer submitted successfully',
  STUDENT_REMOVED: 'Student removed successfully',
} as const;

// PROD: Implement proper rate limiting per IP/user
export const RATE_LIMITS = {
  CREATE_POLL: 10, // per hour
  JOIN_POLL: 50, // per hour
  SUBMIT_ANSWER: 100, // per hour
} as const;

export const TIMEOUTS = {
  DEFAULT_POLL: 60, // seconds
  MAX_POLL: 300, // seconds
  MIN_POLL: 10, // seconds
  SOCKET_DISCONNECT: 5000, // milliseconds
} as const;

// PROD: Implement proper limits based on infrastructure
export const LIMITS = {
  MAX_STUDENTS_PER_POLL: 100,
  MAX_OPTIONS_PER_QUESTION: 6,
  MAX_QUESTION_LENGTH: 500,
  MAX_OPTION_LENGTH: 200,
  MAX_NAME_LENGTH: 50,
  MAX_CHAT_MESSAGE_LENGTH: 500,
} as const;