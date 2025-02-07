const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    logIs : {
        type : 'string',
    },
    who : {
        type : 'string',
    },
})

const SocketLog = mongoose.model('SocketLog', logSchema)
module.exports = SocketLog;