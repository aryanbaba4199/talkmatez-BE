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
    status : {
        type : String,
        required : true
    },
    coins : {
        required : true,
        type : Number,
    },
    time : {
        type : Date,
        default : Date.now(),
    },
})

const TxnModel = mongoose.model('Txn', txnSchema)
module.exports = TxnModel;