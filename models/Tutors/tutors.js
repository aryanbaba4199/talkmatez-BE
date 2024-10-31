const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
    name : {
        type : String,
        require : true
    }, 
    tutorId : {
        type : String,
    },
    qualification : {
        require : true,
        type : String
    }, 
    image : {
        type : String,
    },
    email : {
        require : true,
        type : String
    },
    subject : {
        type : String,
    },
    experience : {
        type : String,
    },
    primaryLanguage : {
        type : String,
        require : true
    },
    secondryLanguage : {
        type : String,
    },
    status : {
        type : String,
        require : true,
        default : 'offline'
    }, 
    tutorType : {
        type : String,
        default : 'Freelancer'
    }, 
    rating : {
        type : []
    },
    rate : {
        type : Number,
        require : true, 
        default : 100
    },
    greet : {
        type : String,
    }, 
    fcmToken : {
        type : String,
    }
});

const Tutors = mongoose.model('Tutors', tutorSchema);
module.exports = Tutors;
