const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
    userId : {
        type : String,
        required : true
    },
    amount : {
        type : Number,
        required : true
    },
    txnId : {
        type : String,
        required : true
    },
    orderId : {
        type : String,
    },
    status : {
        type : String,
        required : true
    },
    coins : {
        required : true,
        type : Number,
    },
    signature : {
        type : String,
    }, 
    time : {
        type : Date,
        default : Date.now(),
    },
    pkgId : {
        type : String,
        required : true
    }, 
    display : {
        type : Boolean,
        default : true
    },
    initialFetch : {
        type : Boolean,
        default : false
    },
    token : {
        type : String,
    }, 
    retry : {
        type : Number, 
        default : 0
    },
})

const TxnModel = mongoose.model('Txn', txnSchema)
module.exports = TxnModel;