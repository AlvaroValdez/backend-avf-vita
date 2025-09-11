const requestLogger = (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logMessage = `${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
        
        if (res.statusCode >= 400) {
            console.error('❌', logMessage);
        } else if (res.statusCode >= 300) {
            console.warn('⚠️', logMessage);
        } else {
            console.log('✅', logMessage);
        }
    });
    
    next();
};

// Logger para errores
const errorLogger = (error, req, res, next) => {
    console.error('🔥 ERROR:', {
        message: error.message,
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    next(error);
};

module.exports = { requestLogger, errorLogger };