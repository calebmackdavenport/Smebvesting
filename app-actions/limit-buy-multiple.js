const simpleBuy = require('./simple-buy');
const alpacaLimitBuy = require('../alpaca/limit-buy');
const mapLimit = require('promise-map-limit');
const sendEmail = require('../utils/send-email');
const lookup = require('../utils/lookup');

module.exports = async (Robinhood, {stocksToBuy, totalAmtToSpend, strategy, maxNumStocksToPurchase, min, withPrices }) => {

    // you cant attempt to purchase more stocks than you passed in
    maxNumStocksToPurchase = maxNumStocksToPurchase ? Math.min(stocksToBuy.length, maxNumStocksToPurchase) : stocksToBuy.length;

    // randomize the order
    stocksToBuy = stocksToBuy.sort(() => Math.random() > Math.random());
    let amtToSpendLeft = totalAmtToSpend;
    let failedStocks = [];

    await mapLimit(stocksToBuy, 3, async stock => {       // 3 buys at a time
        const perStock = totalAmtToSpend;
        console.log(perStock, 'purchasng ', stock);
        try {
            const pickPrice = (withPrices.find(obj => obj.ticker === stock) || {}).price;
            const { askPrice } = await lookup(Robinhood, stock);
            const buyPrice = Math.min(askPrice, pickPrice * 1.07);
            log({
                askPrice,
                pickPrice,
                buyPrice
            })
            const quantity = Math.floor(perStock / buyPrice) || 1;
            alpacaLimitBuy(null, stock, quantity, buyPrice);
            numPurchased++;
        } catch (e) {
            // failed
            failedStocks.push(stock);
            console.log('failed purchase for ', stock);
        }
    });

    console.log('finished purchasing', stocksToBuy.length, 'stocks');
    console.log('attempted amount', totalAmtToSpend);
    if (failedStocks.length) {
        await sendEmail(`Smebvesting: failed to purchase`, JSON.stringify(failedStocks));
    }
};
