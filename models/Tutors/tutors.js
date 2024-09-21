const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
    name : {
        type : String,
        require : true
    }, 
    qualification : {
        require : true,
        type : String
    }, 
    image : {
        type : String,
        require : true,
    },
    mobile : {
        require : true,
        type : String
    },
    subject : {
        type : String,
        require : true
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
        default : 'OFFLINE'
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
        require : true,
    }
});

const Tutors = mongoose.model('Tutors', tutorSchema);
module.exports = Tutors;
