const mongoose = require('mongoose');

const authSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true, 
        index: true 
    },
    primaryLanguage: {
        type: String,
        required: true
    },
    secondaryLanguage: {
        type: String
    },
    otherLanguage: {
        type: String
    },
    passcode: {
        type: String,
        required: true
    },
    coins: {
        type: Number,
        default: 0
    },
    silverCoins: [{
        type: {
            type: String, 
            enum: ["welcome_bonus", "gift", "other"], 
            required: true
        },
        coins: {
            type: Number,
            required: true
        },
        expiry: {
            type: Number 
        },
        time: {
            type: Date,
            default: Date.now 
        },
        pkgId: {
            type: mongoose.Schema.Types.ObjectId, // Better for referencing actual packages
            ref: "Packages" // Assuming a Package model exists
        }
    }]
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const User = mongoose.model('Users', authSchema);

module.exports = User;
