const { alpaca } = require('.');

module.exports = async (ticker, quantity) => {
    log('ALPACA MARKET BUY');
    str({ ticker, quantity });
    const order = await alpaca.createOrder({
        symbol: ticker, // any valid ticker symbol
        qty: quantity,
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
    });
    log(order);
};