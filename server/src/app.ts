import express, { type Application } from 'express';
import cors from 'cors';
import pollRoutes from './routes/poll.routes';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';

/**
 * Express application setup
 * PROD:
 * - Add helmet for security headers
 * - Add compression middleware
 * - Add rate limiting
 * - Add request ID tracking
 * - Add metrics collection (Prometheus)
 * - Add API documentation (Swagger/OpenAPI)
 */

const createApp = (): Application => {
  const app = express();

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // PROD: Add security middleware
  // import helmet from 'helmet';
  // app.use(helmet());

  // PROD: Add compression
  // import compression from 'compression';
  // app.use(compression());

  // PROD: Add rate limiting
  // import rateLimit from 'express-rate-limit';
  // const limiter = rateLimit({
  //   windowMs: 15 * 60 * 1000, // 15 minutes
  //   max: 100, // limit each IP to 100 requests per windowMs
  // });
  // app.use('/api/', limiter);

  // Request logging middleware
  app.use((req, res, next) => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    next();
  });

  // API routes
  app.use('/api', pollRoutes);

  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Live Polling System API',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        polls: '/api/polls',
        socket: '/socket.io',
      },
    });
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
};

export default createApp;