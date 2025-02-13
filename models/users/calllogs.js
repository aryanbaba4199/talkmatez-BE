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
    studentStartSilverCoin : {
        type : Number,
    },
    studentEndCoin : {
        type : Number,
    
    }, 
    srudentEndSilverCoins : {
        type : Number,
    },
    freeMinutes : {
        type : Number,
        default : 0,
    },
    action : {
        type : String,
        default : 0,
    }, 
    connection : {
        type : Boolean,
        default : false,
    }
})

const CallLogs = mongoose.model('CallLogs', callSchema);

module.exports = CallLogs;