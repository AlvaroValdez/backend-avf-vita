const rateLimitStore = new Map();

const createRateLimiter = (windowMs, max, message) => {
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        
        if (!rateLimitStore.has(key)) {
            rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
        } else {
            const record = rateLimitStore.get(key);
            
            if (now > record.resetTime) {
                record.count = 1;
                record.resetTime = now + windowMs;
            } else {
                record.count += 1;
            }
            
            if (record.count > max) {
                return res.status(429).json({
                    message,
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: Math.ceil((record.resetTime - now) / 1000)
                });
            }
        }
        
        // Cleanup antiguo
        if (Math.random() < 0.01) {
            for (const [ip, record] of rateLimitStore.entries()) {
                if (now > record.resetTime + 60000) {
                    rateLimitStore.delete(ip);
                }
            }
        }
        
        next();
    };
};

exports.loginLimiter = createRateLimiter(15 * 60 * 1000, 5, 'Demasiados intentos de login. Intenta en 15 minutos.');
exports.registerLimiter = createRateLimiter(60 * 60 * 1000, 3, 'Demasiados registros desde esta IP. Intenta en 1 hora.');
exports.apiLimiter = createRateLimiter(60 * 1000, 60, 'Demasiadas requests. Intenta en 1 minuto.');