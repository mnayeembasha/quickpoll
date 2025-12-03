import winston from 'winston';

/**
 * Logger utility using Winston
 * PROD: 
 * - Send logs to external service (e.g., CloudWatch, Datadog, ELK)
 * - Implement log rotation
 * - Add request tracing IDs
 * - Mask sensitive data in logs
 */

const logLevel = process.env.LOG_LEVEL || 'info';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      // PROD: Sanitize sensitive data here (passwords, tokens, etc.)
      metaStr = JSON.stringify(meta);
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  }),
];

// PROD: Add file transports with rotation
if (process.env.NODE_ENV === 'production') {
  // Example: Add file transport
  // transports.push(
  //   new winston.transports.File({ 
  //     filename: 'logs/error.log', 
  //     level: 'error',
  //     maxsize: 5242880, // 5MB
  //     maxFiles: 5,
  //   }),
  //   new winston.transports.File({ 
  //     filename: 'logs/combined.log',
  //     maxsize: 5242880,
  //     maxFiles: 5,
  //   })
  // );
}

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  // PROD: Don't exit on uncaught exceptions in production
  exitOnError: process.env.NODE_ENV !== 'production',
});

export default logger;