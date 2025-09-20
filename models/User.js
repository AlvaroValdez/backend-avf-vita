const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Método helper
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passHash);
};

module.exports = mongoose.model("User", userSchema);