const mongoose = require('mongoose');

const langSchema = new mongoose.Schema({
    name: { type: String, required: true },
});

const Language = mongoose.model('Language', langSchema);
module.exports = Language;