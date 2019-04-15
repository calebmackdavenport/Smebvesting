const limitBuyMultiple = require('./limit-buy-multiple');
const getMinutesFrom630 = require('../utils/get-minutes-from-630');
const { purchaseAmt } = require('../settings');

const purchaseStocks = async (Robinhood, { stocksToBuy, strategy, multiplier, min, withPrices }) => {
    const amountPerBuy = purchaseAmt * multiplier;
    const totalAmtToSpend = amountPerBuy;

    console.log('totalAmtToSpend', totalAmtToSpend, 'amtperbuy', amountPerBuy);
    console.log({ stocksToBuy, totalAmtToSpend });
    await limitBuyMultiple(Robinhood, {
        stocksToBuy,
        totalAmtToSpend,
        strategy,
        min,
        withPrices
    });
};

module.exports = purchaseStocks;
