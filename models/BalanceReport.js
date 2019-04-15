const mongoose = require('mongoose');
const { Schema } = mongoose;

const schema = new Schema({
    time : { type : Date, default: Date.now },
    accountBalance: Number,
    indexPrices: {
        sp500: Number,
        nasdaq: Number,
        russell2000: Number
    },
    isRegularHours: Boolean
});

const BalanceReport = mongoose.model('BalanceReport', schema, 'balanceReport');
module.exports = BalanceReport;