const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  receiveAmount: {
    type: Number,
    required: true
  },
  receiveCurrency: {
    type: String,
    required: true,
    uppercase: true
  },
  country: {
    type: String,
    required: true,
    uppercase: true,
    enum: ['BO', 'CO', 'PE', 'VE', 'CL']
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'denied', 'processed'],
    default: 'pending'
  },
  fee: {
    type: Number,
    default: 0
  },
  fxRate: {
    type: Number,
    required: true
  },
  beneficiary: {
    firstName: String,
    lastName: String,
    email: String,
    address: String,
    documentType: String,
    documentNumber: String,
    accountType: String,
    accountNumber: String,
    bankCode: String
  },
  vitaTransactionId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);