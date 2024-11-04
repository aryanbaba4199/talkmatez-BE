const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    start : {
        type: String,
        required : true,
    }, 
    end : {
        type : String,
        required: true
    }, 
    userId : {
        type: String,
        required: true
    },
    secUserId : {
        type: String,
        required: true
    }, 
    tutorStartCoin : {
        type : Number,
      
    }, 
    tutorEndCoin : {
        type : Number,
     
    }, 
    studentStartCoin : {
        type : Number,
    }, 
    studentEndCoin : {
        type : Number,
    
    }, 
})

const CallLogs = mongoose.model('CallLogs', callSchema);

module.exports = CallLogs;