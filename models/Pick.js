const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    date: String,
    strategyName: String,
    min: Number,
    picks: [{
        ticker: String,
        price: Number
    }]
});

schema.statics.getUniqueDates = async function() {
    const response = await this.distinct('date');
    return response.sort((a, b) => new Date(a) - new Date(b));
};

const Pick = mongoose.model('Pick', schema, 'picks');
module.exports = Pick;