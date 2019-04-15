const howMuchBoughtToday = require('./how-much-bought-today');
const limitBuyLastTrade = require('../rh-actions/limit-buy-last-trade');
const jsonMgr = require('../utils/json-mgr');
const lookup = require('../utils/lookup');

const PERC_ALLOWED_ABOVE_PICK_PRICE = 7;
const MINUTES_BEFORE_CANCEL = 10;
const MAX_BUY_PER_STOCK = 360;

const addToDailyTransactions = async data => {
    const fileName = `./json/daily-transactions/${(new Date()).toLocaleDateString().split('/').join('-')}.json`;
    const curTransactions = await jsonMgr.get(fileName) || [];
    curTransactions.push(data);
    await jsonMgr.save(fileName, curTransactions);
};

module.exports = async (
    Robinhood, {
        ticker,
        strategy, // strategy name
        maxPrice, // total amount to spend
        min,
        pickPrice
    }
) => {

    const boughtToday = await howMuchBoughtToday(Robinhood, ticker) || 0;
    const remaining = MAX_BUY_PER_STOCK - boughtToday;
    maxPrice = Math.min(maxPrice, remaining);

    if (maxPrice < 15) {
        throw 'hit max price for ticker';
    }

    const l = await lookup(Robinhood, ticker);
    let bidPrice = l.askPrice;
    const highestAllowed = pickPrice * (PERC_ALLOWED_ABOVE_PICK_PRICE / 100 + 1);
    if (pickPrice && bidPrice > highestAllowed) {
        log('bidPrice above highestAllowed', ticker, {
            bidPrice,
            pickPrice
        });
        bidPrice = Math.min(highestAllowed, bidPrice);
    }

    str({
        bidPrice,
        maxPrice
    })
    const purchase = await limitBuyLastTrade(
        Robinhood, {
            ticker,
            bidPrice,
            maxPrice
        }
    );

    const timeout = 1000 * 60 * MINUTES_BEFORE_CANCEL;
    await new Promise(resolve => setTimeout(resolve, timeout));

    // check state of order
    const {
        state
    } = await Robinhood.url(purchase.url);
    const filled = state === 'filled';
    str({
        filled
    });

    if (filled) {
        // update daily transactions
        const successObj = {
            type: 'buy',
            ticker,
            bid_price: bidPrice,
            quantity,
            strategy,
            min
        };
        await addToDailyTransactions(successObj);
    } else {
        log('failed purchasing', {
            ticker,
            strategy, // strategy name
            maxPrice, // total amount to spend
            min,
            pickPrice
        });
    }
};