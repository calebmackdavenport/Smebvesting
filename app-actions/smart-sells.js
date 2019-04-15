const {
    force: {
        keep: keepers
    }
} = require('../settings');

const detailedNonZero = require('./detailed-non-zero');
const shouldYouSellThisStock = require('../analysis/should-you-sell-this-stock');
const simpleSell = require('./simple-sell');
const sendEmail = require('../utils/send-email');

module.exports = async (Robinhood, dontSell) => {
    let nonZero = await detailedNonZero(Robinhood);
    nonZero = nonZero.filter(pos => !keepers.includes(pos.ticker));

    const withShouldSells = await mapLimit(nonZero, 3, async pos => ({
        ...pos,
        shouldSell: await shouldYouSellThisStock(Robinhood, pos.ticker, pos.average_buy_price)
    }));

    const toSell = withShouldSells
        .filter(pos =>
            pos.shouldSell
        )
        .sort((a, b) => b.returnDollars - a.returnDollars);

    log('to sell: ', toSell.map(pos => pos.ticker));
    if (String(dontSell) === 'true') return;
    await mapLimit(toSell, 3, async pos => {
        const {
            ticker,
            quantity
        } = pos;
        try {
            const response = await simpleSell(
                Robinhood, {
                    ticker,
                    quantity
                }
            );
            console.log(`sold ${quantity} shares of ${ticker}`, response);
            await sendEmail(`Robinsmeb: sold ${ticker}`, JSON.stringify(pos));
        } catch (e) {
            console.log(`error selling ${ticker}`, e);
            await sendEmail(`Robinsmeb: ERROR selling ${ticker}`, [
                JSON.stringify(pos),
                `error: ${e}`
            ].join('\n'));
        }
    });

};