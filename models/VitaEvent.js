// models/VitaEvent.js
const mongoose = require('mongoose');

const VitaEventSchema = new mongoose.Schema(
  {
    headers: { type: Object, default: {} },
    payload: { type: Object, default: {} },
    txId: { type: String, index: true, sparse: true },
    order: { type: String, index: true, sparse: true },
    status: { type: String, index: true, sparse: true },
    receivedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// Evita recompilar modelo en hot-reload
module.exports = mongoose.models.VitaEvent || mongoose.model('VitaEvent', VitaEventSchema, 'vita_events');
