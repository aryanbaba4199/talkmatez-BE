const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    }, 
    mobile : {
        type : String,
        required : true
    },
    primaryLanguage : {
        type : String,
        required : true
    },
    secondaryLanguage : {
        type : String 
    },
    otherLanguage : {
        type : String,
    }, 
    passcode : {
        type : String,
        required : true
    }, 
    coins : {
        type : Number,
        default :0
    },
  
});

const User = mongoose.model('Users', authSchema);

module.exports = User;