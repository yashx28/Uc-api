const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    name:String,
    email: {type :'String',required :true , unique :true},
    password:String,
    })

const userModal = mongoose.model("user", userSchema)
module.exports = userModal;