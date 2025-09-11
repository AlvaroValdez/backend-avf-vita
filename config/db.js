// config/db.js
'use strict';

const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI; // p.ej. mongodb://localhost:27017/avf_vita
const isTest = process.env.NODE_ENV === 'test';

async function connectDB() {
  if (!uri) {
    console.warn('⚠️  MongoDB deshabilitado (sin MONGODB_URI). Continuando sin DB.');
    return; // NO lanzamos error; el servidor puede correr sin DB
  }

  // Opciones seguras (Mongoose 7+ ya no requiere muchos flags antiguos)
  const opts = {
    maxPoolSize: Number(process.env.MONGO_MAX_POOL || 10),
    serverSelectionTimeoutMS: Number(process.env.MONGO_SST_MS || 10000),
    socketTimeoutMS: Number(process.env.MONGO_SOCKET_MS || 45000),
    autoIndex: !isTest, // evita autoindex en test si quieres velocidad
  };

  try {
    await mongoose.connect(uri, opts);

    console.log('✅ MongoDB conectado');
    console.log('   🧩 DB:', mongoose.connection.name);
    console.log('   📡 Host:', mongoose.connection.host);
    console.log('   🔌 PoolSize:', opts.maxPoolSize);

    // Eventos útiles
    mongoose.connection.on('disconnected', () => {
      console.error('⚠️  MongoDB desconectado');
    });
    mongoose.connection.on('error', (err) => {
      console.error('💥 MongoDB error:', err?.message || err);
    });

    // Apagado elegante
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 MongoDB conexión cerrada por SIGINT');
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err?.message || err);
    // Si quieres que el server siga sin DB:
    console.warn('⚠️  Continuando sin DB por error de conexión.');
    // Si prefieres abortar el arranque, descomenta:
    // throw err;
  }
}

module.exports = connectDB;
