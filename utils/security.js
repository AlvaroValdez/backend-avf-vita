// utils/security.js - Utilidades de seguridad

/**
 * Genera un código de verificación de 6 dígitos
 */
exports.generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

/**
 * Valida fortaleza de contraseña
 */
exports.validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return { valid: false, message: `La contraseña debe tener al menos ${minLength} caracteres` };
    }

    if (!hasUpperCase) {
        return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
    }

    if (!hasLowerCase) {
        return { valid: false, message: 'La contraseña debe contener al menos una minúscula' };
    }

    if (!hasNumbers) {
        return { valid: false, message: 'La contraseña debe contener al menos un número' };
    }

    if (!hasSpecialChar) {
        return { valid: false, message: 'La contraseña debe contener al menos un carácter especial' };
    }

    return { valid: true, message: 'Contraseña válida' };
};

/**
 * Sanitiza input para prevenir XSS
 */
exports.sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Genera un token seguro para reset de contraseña
 */
exports.generateSecureToken = (length = 32) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let token = '';
    
    // Usar crypto si está disponible, sino Math.random
    let randomValues;
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        randomValues = new Uint32Array(length);
        crypto.getRandomValues(randomValues);
    } else {
        randomValues = Array.from({ length }, () => Math.floor(Math.random() * chars.length));
    }

    for (let i = 0; i < length; i++) {
        const randomIndex = randomValues[i] % chars.length;
        token += chars[randomIndex];
    }

    return token;
};

/**
 * Calcula la puntuación de fortaleza de contraseña
 */
exports.passwordStrengthScore = (password) => {
    let score = 0;
    
    // Longitud
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Complejidad
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return Math.min(score, 5); // Máximo 5 puntos
};

/**
 * Valida formato de email
 */
exports.isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Escapa caracteres especiales para regex
 */
exports.escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

module.exports = exports;