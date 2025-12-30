// Express application setup with middlewares and routes
// Follows production-ready best practices: helmet, cors, rate-limiting placeholder, error handling
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const articlesRouter = require('./routes/articles');
const { notFoundHandler, errorHandler } = require('./utils/errors');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Healthcheck
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/articles', articlesRouter);

// 404 and error handlers
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

