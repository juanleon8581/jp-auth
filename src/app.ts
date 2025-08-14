import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import envs from './config/envs';

/**
 * JP Auth API - Main Application Entry Point
 */

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: envs.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: envs.RATE_LIMIT_WINDOW_MS,
  max: envs.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(envs.RATE_LIMIT_WINDOW_MS / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: envs.NODE_ENV,
    version: envs.API_VERSION
  });
});

// API routes placeholder
app.get('/api/v1/status', (req, res) => {
  res.json({
    message: 'JP Auth API is running',
    version: envs.API_VERSION,
    environment: envs.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(err.status || 500).json({
    error: envs.NODE_ENV === 'prod' ? 'Internal server error' : err.message,
    ...(envs.NODE_ENV !== 'prod' && { stack: err.stack })
  });
});

// Start server
const PORT = envs.PORT;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 JP Auth API running on port ${PORT}`);
    console.log(`📊 Environment: ${envs.NODE_ENV}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;