var mongoose = require('mongoose');

module.exports = mongoose.model('URLDATA', {
    url: {
        type: String,
        default: ''
    },
    redirectedUrl: {
        type: String,
        default: ''
    },
    redirectChainLength: {
        type: String,
        default: ''
    },
    ipAddress: {
        type: String,
        default: ''
    },
    applications: {
        type: Array,
        default: []
    }
});