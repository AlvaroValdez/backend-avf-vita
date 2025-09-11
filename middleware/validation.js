// middleware/validation.js
const Joi = require('joi');

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    profile: Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        phone: Joi.string().optional(),
        documentType: Joi.string().valid('DNI', 'RUT', 'CPF', 'CEDULA', 'PASAPORTE').optional(),
        documentNumber: Joi.string().optional(),
        birthDate: Joi.date().max('now').optional(),
        country: Joi.string().length(2).optional()
    }).required(),
    business: Joi.object({
        name: Joi.string().optional(),
        taxId: Joi.string().optional(),
        businessType: Joi.string().valid('INDIVIDUAL', 'COMPANY').optional(),
        industry: Joi.string().optional()
    }).optional(),
    preferences: Joi.object({
        language: Joi.string().default('es'),
        currency: Joi.string().default('USD'),
        notifications: Joi.object({
            email: Joi.boolean().default(true),
            sms: Joi.boolean().default(false),
            push: Joi.boolean().default(true)
        }).default({})
    }).optional()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).required()
});

const validateRegister = (req, res, next) => {
    const { error } = registerSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: 'Datos de registro inválidos',
            details: error.details.map(d => d.message),
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

const validateLogin = (req, res, next) => {
    const { error } = loginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: 'Datos de login inválidos',
            details: error.details.map(d => d.message),
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

const validateChangePassword = (req, res, next) => {
    const { error } = changePasswordSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            message: 'Datos de cambio de contraseña inválidos',
            details: error.details.map(d => d.message),
            code: 'VALIDATION_ERROR'
        });
    }
    next();
};

module.exports = {
    validateRegister,
    validateLogin,
    validateChangePassword
};