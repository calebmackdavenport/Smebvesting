const lookupMultiple = require('../utils/lookup-multiple');
const stratManager = require('../socket-server/strat-manager');
const Pick = require('../models/Pick');
const stratOfInterest = require('../utils/strat-of-interest');

const purchaseStocks = require('./purchase-stocks');
const sendEmail = require('../utils/send-email');
const calcEmailsFromStrategy = require('../utils/calc-emails-from-strategy');
const {
    disableMultipliers
} = require('../settings');
const moment = require('moment');

const saveToFile = async (Robinhood, strategy, min, withPrices) => {

    const stratMin = `${strategy}-${min}`;

    if (!stratOfInterest(stratMin, withPrices.length)) return;
    if (!strategy.includes('cheapest-picks')) withPrices = withPrices.slice(0, 3); // take only 3 picks

    withPrices = withPrices.filter(tickerPrice => !!tickerPrice);
    if (!withPrices.length) {
        return console.log(`no stocks found for ${stratMin}`)
    }

    // console.log('recording', stratMin, 'strategy');
    const dateStr = moment(new Date()).format('LLL')

    // save to mongo
    console.log(`saving ${strategy} to mongo`);
    await Pick.create({
        date: dateStr,
        strategyName: strategy,
        min,
        picks: withPrices
    });

    // for socket-server
    stratManager.newPick({
        stratMin,
        withPrices
    });

    // helper
    const getEnableCountForPM = pm => {
        // how many times does this strategy show up in this pm?
        const stratsWithinPM = stratManager.predictionModels ? stratManager.predictionModels[pm] : [];
        return stratsWithinPM.filter(strat => strat === stratMin).length;
    };

    // for purchase
    const forPurchaseMultiplier = getEnableCountForPM('forPurchase');
    if (forPurchaseMultiplier) {
        console.log('strategy enabled: ', stratMin, 'purchasing');
        const stocksToBuy = withPrices.map(obj => obj.ticker);
        await purchaseStocks(Robinhood, {
            stocksToBuy,
            strategy,
            multiplier: !disableMultipliers ? forPurchaseMultiplier : 1,
            min,
            withPrices
        });
    }

    // for email$
    const emailsToSend = await calcEmailsFromStrategy(null, stratMin);
    for (let {
            email,
            pm
        } of emailsToSend) {
        await sendEmail(
            `Smebvesting${pm ? `-${pm}` : ''}: ${stratMin}`,
            JSON.stringify(withPrices, null, 2),
            email
        );
    }



};





module.exports = async (Robinhood, strategy, min, toPurchase, trendKey = '') => {

    const isNotRegularHours = min < 0 || min > 390;

    const record = async (stocks, strategyName, tickerLookups) => {
        const withPrices = stocks.map(ticker => {
            const relatedLookup = tickerLookups[ticker];
            const price = isNotRegularHours ?
                relatedLookup.afterHoursPrice || relatedLookup.lastTradePrice :
                relatedLookup.lastTradePrice;
            return {
                ticker,
                price
            };
        });
        await saveToFile(Robinhood, strategyName, min, withPrices);
    };

    if (!Array.isArray(toPurchase)) {
        // its an object
        const allTickers = [...new Set(
            Object.keys(toPurchase)
            .map(strategyName => toPurchase[strategyName])
            .reduce((acc, val) => acc.concat(val), []) // flatten
        )];
        // console.log('alltickers', allTickers);
        const tickerLookups = await lookupMultiple(Robinhood, allTickers, true);
        // console.log('tickerLookups', tickerLookups);
        for (let strategyName of Object.keys(toPurchase)) {
            const subsetToPurchase = toPurchase[strategyName];
            const stratName = [
                strategy,
                trendKey,
                strategyName
            ].filter(Boolean).join('-');
            await record(subsetToPurchase, stratName, tickerLookups);
        }
    } else {
        // console.log('no variety to purchase', toPurchase);
        const tickerLookups = await lookupMultiple(Robinhood, toPurchase, true);
        const stratName = [strategy, trendKey].filter(Boolean).join('-');
        await record(toPurchase, stratName, tickerLookups);
    }

};
