const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        index: true
    },
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET', '2FA'],
        default: 'EMAIL_VERIFICATION'
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expireAfterSeconds: 0 }
    },
    attempts: {
        type: Number,
        default: 0
    },
    used: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Método estático para crear código
verificationCodeSchema.statics.createCode = async function(email, type = 'EMAIL_VERIFICATION', expiresInMinutes = 15) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    await this.updateMany(
        { email, type, used: false },
        { used: true }
    );

    return this.create({
        email,
        code,
        type,
        expiresAt
    });
};

// Método para verificar código
verificationCodeSchema.statics.verifyCode = async function(email, code, type = 'EMAIL_VERIFICATION') {
    const verificationCode = await this.findOne({
        email,
        code,
        type,
        used: false,
        expiresAt: { $gt: new Date() }
    });

    if (!verificationCode) {
        return { valid: false, reason: 'Código inválido o expirado' };
    }

    if (verificationCode.attempts >= 3) {
        return { valid: false, reason: 'Demasiados intentos fallidos' };
    }

    verificationCode.attempts += 1;
    await verificationCode.save();

    if (verificationCode.attempts > 3) {
        return { valid: false, reason: 'Demasiados intentos fallidos' };
    }

    verificationCode.used = true;
    await verificationCode.save();

    return { valid: true };
};

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);