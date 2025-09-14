const User = require('../models/User');
const { generateVerificationCode } = require('../utils/security');

// Funciones que DEFINITIVAMENTE existen
const register = async (req, res) => {
    try {
        const { email, password, profile } = req.body;

        console.log('📝 Registrando usuario:', email);

        // Validación básica
        if (!email || !password || !profile?.firstName) {
            return res.status(400).json({
                message: 'Faltan campos requeridos',
                code: 'MISSING_FIELDS'
            });
        }

        // Verificar si existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                message: 'El email ya está registrado',
                code: 'EMAIL_EXISTS'
            });
        }

        // Crear usuario
        const user = new User({
            email,
            password,
            profile,
            verification: { emailVerified: false }
        });

        await user.save();

        // Mostrar código de verificación en consola
        const verificationCode = generateVerificationCode();
        console.log('📧 Código de verificación para', email, ':', verificationCode);

        // Generar token
        const token = user.generateAuthToken();

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: user._id,
                email: user.email,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('🔐 Intentando login:', email);
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Credenciales inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }
        const token = user.generateAuthToken();

        const isProd = process.env.NODE_ENV === 'production';
        if (req.body?.withCookie) {
        res.cookie('sid', token, {
            httpOnly: true,
            secure: isProd,                 // en Render: true
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 1000*60*60*8,
        });
        }


        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user._id,
                email: user.email,
                profile: user.profile
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            message: 'Error interno del servidor',
            code: 'INTERNAL_ERROR'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                profile: req.user.profile
            }
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al obtener perfil',
            code: 'INTERNAL_ERROR'
        });
    }
};

const logout = async (req, res) => {
    try {
        res.json({
            message: 'Logout exitoso'
        });
    } catch (error) {
        res.status(500).json({
            message: 'Error al hacer logout',
            code: 'INTERNAL_ERROR'
        });
    }
};

// Exportar como objeto
module.exports = {
    register,
    login,
    getProfile,
    logout
};