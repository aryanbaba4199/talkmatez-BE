const mongoose = require('mongoose')

const pkgSchema = new mongoose.Schema({
    title : {
        type : String,
        require : true
    },
    narration : {
        type : String,
        require : true
    },
    icon : {
        type : String,
        
    },
    amount : {
        type : Number,
        require : true
    }, 
    coins : {
        type : Number,
        require : true
    }
});

const PkgModel = mongoose.model('Packages', pkgSchema);
module.exports = PkgModel;