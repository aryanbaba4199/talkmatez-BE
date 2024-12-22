const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        unique: true
    },
    code : {
        type: String,
        required: true,
        unique: true
    }, 
    mobileDigits : {
        type: Number,
        required: true,
    }
})

const Country = mongoose.model('Country', countrySchema);

module.exports = Country;