const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/', (req, res) => {
  const dbStateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = dbStateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    service: 'SecureBank API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      isConnected: mongoose.connection.readyState === 1,
    },
  });
});

module.exports = router;
