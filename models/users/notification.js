const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId : {
        type : String,
        required : true
    },
    title : {
        type : String,
        required : true
    },
    message : {
        type : String,
        required : true
    },
    time : {
        type : Date,
        default : Date.now()
    },
    read : {
        type : Boolean,
        default : false
    }, 
    priority : {
        type : String,
        default : 'normal'
    }, 
    icon : {
        type : String,
    },
    action : {
        type : String,
    },
    otherId : {
        type : String,
        
    }
});
const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;