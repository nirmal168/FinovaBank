const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const initSocket = (server) => {
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive for local dev / testing
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // JWT Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication token required for WebSocket'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'securebank_fallback_secret');
      const user = await User.findById(decoded.id).select('_id name email role');
      if (!user) {
        return next(new Error('User account not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`WebSocket authentication failed: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    const userRoom = `user:${userId}`;
    socket.join(userRoom);
    console.log(`[Socket.IO] User connected: ${socket.user.name} (${userId}) joined room ${userRoom}`);

    if (socket.user.role === 'admin') {
      socket.join('admins');
      console.log(`[Socket.IO] Admin ${socket.user.name} joined 'admins' room`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] User disconnected: ${userId}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

const emitAdminFraudAlert = (fraudAlert) => {
  if (io) {
    io.to('admins').emit('fraud:alert', fraudAlert);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitAdminFraudAlert,
};
