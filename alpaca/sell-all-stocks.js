const { alpaca } = require('.');
const { force: { keep }} = require('../settings');

module.exports = async (_, dontSell) => {
    let positions = await alpaca.getPositions();
    positions = positions.filter(pos => !keep.includes(pos.symbol));
    log('selling' + positions.map(p => p.symbol));
    if (dontSell) return;
    for (let pos of positions) {
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