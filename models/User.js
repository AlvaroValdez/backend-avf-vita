// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email inválido']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    profile: {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        phone: { type: String, match: [/^\+?[\d\s\-()]+$/, 'Teléfono inválido'] },
        documentType: { type: String, enum: ['DNI', 'RUT', 'CPF', 'CEDULA', 'PASAPORTE'] },
        documentNumber: { type: String },
        birthDate: { type: Date },
        country: { type: String, enum: ['CL', 'CO', 'PE', 'AR', 'MX', 'ES', 'US'] }
    },
    business: {
        name: { type: String },
        taxId: { type: String },
        businessType: { type: String, enum: ['INDIVIDUAL', 'COMPANY'] },
        industry: { type: String }
    },
    verification: {
        emailVerified: { type: Boolean, default: false },
        phoneVerified: { type: Boolean, default: false },
        identityVerified: { type: Boolean, default: false },
        verificationLevel: { type: String, enum: ['BASIC', 'INTERMEDIATE', 'FULL'], default: 'BASIC' }
    },
    security: {
        twoFactorEnabled: { type: Boolean, default: false },
        lastPasswordChange: { type: Date, default: Date.now },
        loginAttempts: { type: Number, default: 0 },
        lockUntil: { type: Date },
        lastLogin: { type: Date }
    },
    preferences: {
        language: { type: String, default: 'es' },
        currency: { type: String, default: 'USD' },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true }
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED'],
        default: 'PENDING'
    }
}, {
    timestamps: true
});

// Índices para mejor performance
userSchema.index({ email: 1 });
userSchema.index({ 'profile.documentNumber': 1 });
userSchema.index({ status: 1 });

// Métodos para seguridad
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateAuthToken = function() {
    return jwt.sign(
        { 
            userId: this._id,
            email: this.email,
            verificationLevel: this.verification.verificationLevel
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

userSchema.methods.incrementLoginAttempts = function() {
    if (this.security.lockUntil && this.security.lockUntil > Date.now()) {
        return; // Ya está bloqueado
    }
    
    this.security.loginAttempts += 1;
    
    if (this.security.loginAttempts >= 5) {
        this.security.lockUntil = Date.now() + 15 * 60 * 1000; // 15 minutos
    }
};

userSchema.virtual('isLocked').get(function() {
    return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
});

module.exports = mongoose.model('User', userSchema);