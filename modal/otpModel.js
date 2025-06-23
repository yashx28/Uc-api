// models/OtpModel.js
const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300  // expires in 5 minutes
  }
});

const OtpModel = mongoose.model('Otp', otpSchema);
module.exports = OtpModel;
