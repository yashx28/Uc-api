const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: true
  }
});

const BarberModel = mongoose.model("Barber", barberSchema);
module.exports = BarberModel;
