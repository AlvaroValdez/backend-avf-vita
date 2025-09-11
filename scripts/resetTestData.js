require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetTestData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to database');
        
        // Eliminar usuarios existentes
        await mongoose.connection.db.collection('users').deleteMany({});
        console.log('🧹 Deleted existing users');
        
        // Crear usuario de prueba
        const hashedPassword = await bcrypt.hash('Test123!', 12);
        
        const testUser = {
            email: 'test@avf.com',
            password: hashedPassword,
            profile: {
                firstName: 'Test',
                lastName: 'User',
                country: 'CL'
            },
            verification: {
                emailVerified: true,
                verificationLevel: 'FULL'
            },
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await mongoose.connection.db.collection('users').insertOne(testUser);
        console.log('✅ Test user created: test@avf.com / Test123!');
        
        // Crear usuario admin
        const adminPassword = await bcrypt.hash('Admin123!', 12);
        
        const adminUser = {
            email: 'admin@avf.com',
            password: adminPassword,
            profile: {
                firstName: 'Admin',
                lastName: 'AVF',
                country: 'CL'
            },
            verification: {
                emailVerified: true,
                verificationLevel: 'FULL'
            },
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await mongoose.connection.db.collection('users').insertOne(adminUser);
        console.log('✅ Admin user created: admin@avf.com / Admin123!');
        
        console.log('\n📋 Credenciales de prueba:');
        console.log('----------------------------');
        console.log('Usuario: test@avf.com');
        console.log('Password: Test123!');
        console.log('----------------------------');
        console.log('Admin: admin@avf.com');
        console.log('Password: Admin123!');
        console.log('----------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetTestData();