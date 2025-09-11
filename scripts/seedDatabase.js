// scripts/seedDatabase.js
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdminUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const adminExists = await User.findOne({ email: 'admin@avf.com' });
        if (!adminExists) {
            const adminUser = new User({
                email: 'admin@avf.com',
                password: 'Admin123!',
                profile: {
                    firstName: 'Admin',
                    lastName: 'AVF',
                    country: 'CL'
                },
                verification: {
                    emailVerified: true,
                    verificationLevel: 'FULL'
                },
                status: 'ACTIVE'
            });

            await adminUser.save();
            console.log('✅ Admin user created successfully');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedAdminUser();