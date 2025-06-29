const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    initiated : {
        type : String,
        default : Date.now()
    },
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
    userCustomId : {
        type: String,
        // required: true
        immutable : true,
    },
    tutorCustomId : {
        type: String,
        immutable: true
        // required: true
    },
    umobile : {
        type: String,
        immutable: true
    },
    secUserId : {
        type: String,
        required: true
    }, 
    tutorStartGoldCoin : {
        type : Number,
        default : 0,
    }, 
    tutorStartSilverCoin : {
        type : Number,
        default : 0,
    },

    tutorEndGoldCoin : {
        type : Number,
     
    }, 
    tutorEndSilverCoin : {
        type : Number,
    },
    studentStartGoldCoin : {
        type : Number,
    }, 
    studentStartSilverCoin : {
        type : Number,
    },
    studentEndGoldCoin : {
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
    },
    charge : {
        type : Number,
        default : 0,
    }
    
    
})

const CallLogs = mongoose.model('CallLogs', callSchema);

module.exports = CallLogs;