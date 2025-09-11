// services/emailService.js
const nodemailer = require('nodemailer');

// Configuración para desarrollo - usar Ethereal Email para testing
const createTransporter = () => {
    if (process.env.NODE_ENV === 'production') {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_PORT === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    } else {
        // Para desarrollo, usar Ethereal Email (no requiere configuración real)
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: 'tara.wisoky@ethereal.email', // Email de prueba
                pass: 'G6a5P1rJf1y8r7CkfY' // Password de prueba
            }
        });
    }
};

const transporter = createTransporter();

const emailTemplates = {
    verification: (name, code) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Verifica tu email - Vita Wallet</h2>
            <p>Hola ${name},</p>
            <p>Gracias por registrarte en Vita Wallet. Tu código de verificación es:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="color: #2563eb; margin: 0; font-size: 32px;">${code}</h1>
            </div>
            <p>Este código expirará en 15 minutos.</p>
            <p>Si no solicitaste este registro, por favor ignora este email.</p>
        </div>
    `,

    welcome: (name) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">¡Bienvenido a Vita Wallet!</h2>
            <p>Hola ${name},</p>
            <p>Tu cuenta ha sido verificada exitosamente. Ahora puedes:</p>
            <ul>
                <li>Realizar transferencias internacionales</li>
                <li>Gestionar múltiples wallets</li>
                <li>Monitorear tus transacciones en tiempo real</li>
            </ul>
            <p>¡Gracias por elegirnos!</p>
        </div>
    `
};

// Función para probar la conexión de email
exports.testEmailConnection = async () => {
    try {
        if (process.env.NODE_ENV === 'production') {
            await transporter.verify();
            console.log('✅ Email server connected successfully');
        } else {
            console.log('📧 Using Ethereal Email for development');
            // Crear una cuenta de prueba automáticamente
            const testAccount = await nodemailer.createTestAccount();
            console.log('Ethereal Email account created:');
            console.log('Email:', testAccount.user);
            console.log('Password:', testAccount.pass);
            console.log('Web: https://ethereal.email/');
        }
        return true;
    } catch (error) {
        console.warn('⚠️ Email configuration issue:', error.message);
        console.log('ℹ️ Emails will be logged to console instead');
        return false;
    }
};

exports.sendVerificationEmail = async (email, code, name) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@vitawallet.com',
            to: email,
            subject: 'Verifica tu email - Vita Wallet',
            html: emailTemplates.verification(name, code)
        };

        if (process.env.NODE_ENV === 'production') {
            const info = await transporter.sendMail(mailOptions);
            console.log('✅ Email de verificación enviado:', info.messageId);
        } else {
            // En desarrollo, mostrar el email en consola
            console.log('📧 [DEV] Verification email would be sent:');
            console.log('To:', email);
            console.log('Code:', code);
            console.log('Preview: https://ethereal.email/');
            
            // También enviar a Ethereal para testing real
            const info = await transporter.sendMail(mailOptions);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
        }

    } catch (error) {
        console.error('❌ Error enviando email de verificación:', error);
        // No throw para no bloquear el registro
        console.log('📧 Email simulation (dev mode):', { to: email, code });
    }
};

exports.sendWelcomeEmail = async (email, name) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@vitawallet.com',
            to: email,
            subject: '¡Bienvenido a Vita Wallet!',
            html: emailTemplates.welcome(name)
        };

        if (process.env.NODE_ENV === 'production') {
            await transporter.sendMail(mailOptions);
            console.log('✅ Email de bienvenida enviado a:', email);
        } else {
            console.log('📧 [DEV] Welcome email would be sent to:', email);
        }
    } catch (error) {
        console.error('❌ Error enviando email de bienvenida:', error);
        // No throw, esto no es crítico
    }
};