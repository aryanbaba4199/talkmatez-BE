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
    balance : {
        type : Number,
        default :0
    },

    // for Tutors  
    userType : {
        type : String,
        default : 'user',
    },
    qualification : {
        type : String
    }, 
    rate : {
        type : Number
    },
    jobType : {
        type : String,
        default : 'freelancer'
    }, 
    description : {
        type : String
    },
    tutorStatus : {
        type : String,
        default : 'offline'
    },
    rating : {
       type :  []
    }
  
});

const User = mongoose.model('Users', authSchema);

module.exports = User;