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
    },
    email : {
        require : true,
        type : String, 
        unique : true
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
    rating: [
        {
          userId: { type: String },
          rating: { type: Number },
          review: { type: String },
        },
      ],
    coins : {
        type : Number,
        default : 0
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
    }, 
    loginId : {
        type : String,
        require : true, 
        unique : true
    }, 
    password : {
        type : String,
        require : true
    },
    rank : {
        type : Number,
        default : 1,
        unique : true,
    },
});

const Tutors = mongoose.model('Tutors', tutorSchema);
module.exports = Tutors;
