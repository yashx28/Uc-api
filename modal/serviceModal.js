const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  }
});

const ServiceModel = mongoose.model("Service", serviceSchema);
module.exports = ServiceModel;
