import dotenv from 'dotenv';
import { createServer } from 'http';
import createApp from './app';
import { initializeSocketIO } from './config/socket.config';
import SocketController from './controllers/socket.controller';
import logger from './utils/logger';
import { SOCKET_EVENTS } from './utils/constants';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  try {
    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.io
    const io = initializeSocketIO(httpServer);

    // Initialize Socket controller
    const socketController = new SocketController(io);

    // Register socket connection handler
    io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
      socketController.handleConnection(socket);
    });

    // Start server
    httpServer.listen(PORT, () => {
      logger.info('Server started successfully', {
        port: PORT,
        env: NODE_ENV,
        nodeVersion: process.version,
      });

      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Live Polling System Server                          ║
║                                                           ║
║   Environment: ${NODE_ENV.padEnd(42)} ║
║   Port:        ${String(PORT).padEnd(42)} ║
║   API:         http://localhost:${PORT}/api${' '.repeat(21)} ║
║   Socket.io:   http://localhost:${PORT}/socket.io${' '.repeat(15)} ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });

    // PROD: Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown`);

      // Stop accepting new connections
      httpServer.close(() => {
        logger.info('HTTP server closed');
      });

      // Close all socket connections
      io.close(() => {
        logger.info('Socket.io server closed');
      });

      // PROD: Close database connections
      // await mongoose.connection.close();

      // PROD: Clear any pending timers/intervals
      // clearInterval(cleanupInterval);

      logger.info('Graceful shutdown completed');
      process.exit(0);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      // PROD: Send to error tracking service
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      // PROD: Send to error tracking service
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();