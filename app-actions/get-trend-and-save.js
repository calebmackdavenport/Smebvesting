const getTrendSinceOpen = require('../rh-actions/get-trend-since-open');
const jsonMgr = require('../utils/json-mgr');
const getMinutesFrom630 = require('../utils/get-minutes-from-630');

const getAllTickers = require('../rh-actions/get-all-tickers');
const {
    isTradeable
} = require('../utils/filter-by-tradeable.js');
const blacklist = require('../blacklist');
const moment = require('moment');

const getTrendAndSave = async (Robinhood, min) => {

    min = min || getMinutesFrom630();

    // step 1 - get all tickers
    try {
        var allTickers = require('../json/stock-data/allStocks');
    } catch (e) {
        allTickers = await getAllTickers(Robinhood);
    }
    allTickers = allTickers
        .filter(isTradeable)
        .map(stock => stock.symbol);

    // step 2 - get trend
    console.log(`getting trend since open for all stocks - 6:31am + ${min} minutes`);
    let trendingArray = await getTrendSinceOpen(Robinhood, allTickers);
    trendingArray = trendingArray.filter(o => !blacklist.includes(o.ticker));

    const dateStr = moment(new Date()).format('LLL')

    // step 3 - save trend
    await jsonMgr.save(`./json/stock-data/${dateStr} (+${min}).json`, trendingArray);
    console.log('done getting trend');

    return trendingArray;

};

module.exports = getTrendAndSave;
