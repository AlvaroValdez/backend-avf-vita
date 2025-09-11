const express = require('express');
const cors = require('cors');
const { requestLogger, errorLogger } = require('./utils/logger'); // ← Cambiado
const securityHeaders = require('./middleware/security');
const { loginLimiter, registerLimiter, apiLimiter } = require('./middleware/rateLimit'); // ← Agregado apiLimiter

// Routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallets');
const transactionRoutes = require('./routes/transactions');

const app = express();

// Security headers
app.use(securityHeaders);

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/', apiLimiter); // ← Agregado rate limiting general

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    });
});

// Error logging
app.use(errorLogger); // ← Agregado error logger

// Error handling
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    
    res.status(500).json({
        message: 'Error interno del servidor',
        code: 'INTERNAL_SERVER_ERROR'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Endpoint no encontrado',
        code: 'NOT_FOUND',
        path: req.originalUrl
    });
});

module.exports = app;