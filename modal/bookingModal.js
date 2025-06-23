const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  date: String,
  timeSlot: String,
  mode: String,
  name: String,
  email: String,
  address: String,
  phone: String,
  service: String,
});

const bookingModel = mongoose.model('Booking', bookingSchema);
module.exports = bookingModel;
