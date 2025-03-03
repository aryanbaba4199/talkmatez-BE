const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
    image : {
        type: String,
        required: true
    },
    title : {
        type: String,
        required: true
    },
    rank : {
        type: Number,
    }
});

module.exports = mongoose.model('Slider', sliderSchema);