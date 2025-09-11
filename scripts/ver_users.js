// Script temporal para ver usuarios
const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await mongoose.connection.db.collection('users').find().toArray();
    console.log('Usuarios en la base de datos:');
    users.forEach(user => {
        console.log(`- ${user.email} (${user.profile?.firstName} ${user.profile?.lastName})`);
    });
    process.exit();
}

checkUsers();