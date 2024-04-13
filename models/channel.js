const mongoose = require("mongoose")
var uniqueValidator = require('mongoose-unique-validator');

// Sub-schema for fruits
const fruitSchema = new mongoose.Schema({
    bitcoin: Number,
    atom: Number,
    ethereum: Number,
    solana: Number
});

// Sub-schema for game stats
const gameStatsSchema = new mongoose.Schema({
    highestLevelReached: Number,
    totalPlayTime: Number, // You can use milliseconds or any other unit
    coinsCollected: Number,
    fruitCollected: [fruitSchema],
    enemiesKilled: Number,
    attacksUsed: Number,
    deaths: Number,
    coinsPerLevel: Number,
    attackEfficiency: Number, // Could be a percentage or other metric
    KD: Number, // Could be a percentage or other metric
    attacksHit: Number,
    levelsPlayed: Number
});

// Sub-schema for ranks
const ranksSchema = new mongoose.Schema({
    luncRank: Number,
    levelRank: Number  
});

// Sub-schema for activeNfts
const activeNftsSchema = new mongoose.Schema({
    pfp: String,
    glotag: String,
    arcade: String,
    luncman: String,
    victory: String,
    reactions: [String]
});

const channelSchema = new mongoose.Schema({
    walletID:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    nickname: {
        type: String,
        trim: true,
        unique:true
    },
    highscore:{
        type:Number,
        required:true,
        trim:true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    gloLvl: {
        type: Number,
        default: 0
    },
    friends: {
        type: [String], // Placeholder, Array of friend IDs or names
        default: []
    },
    friendRequestsSent: {
        type: [String],
        default: []
    },
    friendRequestsReceived: {
        type: [String],
        default: []
    },    
    settings: {
        type: [String], // Placeholder, can later be an array of subdocuments
        default: []
    },
    gameStats: {
        type: gameStatsSchema,
        default: {}
    },
    achievements: {
        type: [String], // Placeholder, can later be an array of subdocuments
        default: []
    },
    ranks: {
        type: ranksSchema,
        default: {}
    },
    refreshToken: {
        type: String,
        default: null
    },
    activeNfts: {
        type: activeNftsSchema,
        default: {}
    }
});

channelSchema.plugin(uniqueValidator);
channelSchema.index({ highscore: -1, gloLvl: -1 });

const ChannelModel = mongoose.model("Leaderboard", channelSchema)

module.exports = ChannelModel




