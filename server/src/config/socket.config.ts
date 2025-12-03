import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import logger from '../utils/logger';

/**
 * Socket.io configuration
 * PROD:
 * - Enable Redis adapter for horizontal scaling
 * - Implement proper CORS policy
 * - Add authentication middleware
 * - Configure sticky sessions for load balancing
 * - Add socket.io admin UI
 */

export const initializeSocketIO = (httpServer: HTTPServer): Server => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // PROD: Tune these based on your needs
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000'),
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000'),
    maxHttpBufferSize: 1e6, // 1MB max message size
    // PROD: Enable compression for production
    perMessageDeflate: process.env.NODE_ENV === 'production' ? {
      threshold: 1024, // Compress messages larger than 1KB
    } : false,
  });

  // PROD: Add Redis adapter for multi-server support
  // import { createAdapter } from '@socket.io/redis-adapter';
  // import { createClient } from 'redis';
  // const pubClient = createClient({ url: process.env.REDIS_URL });
  // const subClient = pubClient.duplicate();
  // await Promise.all([pubClient.connect(), subClient.connect()]);
  // io.adapter(createAdapter(pubClient, subClient));

  // Connection middleware (PROD: Add authentication here)
  io.use((socket, next) => {
    // PROD: Verify JWT token
    // const token = socket.handshake.auth.token;
    // if (!token) {
    //   return next(new Error('Authentication required'));
    // }
    // Verify token and attach user info to socket
    // socket.data.user = verifiedUser;
    
    logger.debug('Socket authentication passed', { socketId: socket.id });
    next();
  });

  // Log connection stats periodically
  // PROD: Send to monitoring service
  setInterval(() => {
    const sockets = io.sockets.sockets.size;
    logger.info('Socket.io stats', { 
      connectedSockets: sockets,
      rooms: io.sockets.adapter.rooms.size,
    });
  }, 60000); // Every minute

  logger.info('Socket.io initialized', { allowedOrigins });
  return io;
};

export default initializeSocketIO;