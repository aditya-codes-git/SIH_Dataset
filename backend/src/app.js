const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const { getDBStatus } = require('./config/db');
const screeningRoutes = require('./routes/screeningRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const agentRoutes = require('./routes/agentRoutes');
const fileRoutes = require('./routes/fileRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads statically as fallback
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// API Health check route
app.get('/api/health', (req, res) => {
  const dbStatus = getDBStatus();
  res.json({
    status: 'OK',
    service: 'DR Screening API Bridge',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus.connected ? 'CONNECTED' : 'UNAVAILABLE',
      readyState: dbStatus.readyState,
      error: dbStatus.error || null,
    },
    matlabModel: {
      status: 'READY',
      entryPoint: 'runScreeningFromFile.m',
    },
  });
});

// Mount Routes
app.use('/api/screenings', screeningRoutes);
app.use('/api/screenings', reviewRoutes); // Mounted under /api/screenings/:id/review
app.use('/api/agent', agentRoutes);
app.use('/api/files', fileRoutes);

// 404 Route handler
app.use((req, res) => {
  res.status(404).json({
    status: 'FAILED',
    error: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
