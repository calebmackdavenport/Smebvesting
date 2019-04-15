const { alpaca } = require('.');
const { force: { keep }} = require('../settings');
const shouldYouSellThisStock = require('../analysis/should-you-sell-this-stock');

module.exports = async (Robinhood, dontSell) => {

    let positions = await alpaca.getPositions();
    positions = positions.filter(pos => !keep.includes(pos.symbol));
    str({ positions })
    const withShouldSells = await mapLimit(positions, 3, async pos => ({
        ...pos,
        shouldSell: await shouldYouSellThisStock(Robinhood, pos.symbol, pos.avg_entry_price)
    }));

    log('selling' + withShouldSells.map(p => p.symbol));

    str({ withShouldSells })

    const toSell = withShouldSells.filter(pos => pos.shouldSell);
    if (dontSell === "true") return;
    for (let pos of toSell) {
        const order = await alpaca.createOrder({
            symbol: pos.symbol, // any valid ticker symbol
            qty: Number(pos.qty),
            side: 'sell',
            type: 'market',
            time_in_force: 'day',
        });
        log(order)
    }
};