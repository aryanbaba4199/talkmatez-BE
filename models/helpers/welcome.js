const mongoose = require('mongoose');

const welSchema = new mongoose.Schema({
    title : {
        type : String,
        required : true
    }, 
    coinType : {
        type : String,
        required : true
    }, 
    coinValue : {
        type : Number,
        required : true
    }, 
    expiry : {
        type : Number,
    }
})

const WelModel = mongoose.model('Welcome', welSchema);

module.exports = WelModel; 
