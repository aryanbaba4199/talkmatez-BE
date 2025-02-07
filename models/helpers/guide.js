const mongoose = require('mongoose');

const guideSchema = new mongoose.Schema({
    rank : {
        type : String,
        required : true,
        unique : true,
    }, 
    image : {
        type : String,
        required : true
    }
})

const Guide = mongoose.model('Guide', guideSchema);
module.exports = Guide;