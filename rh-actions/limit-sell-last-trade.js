const lookup = require('../utils/lookup');

module.exports = async (Robinhood, {
    ticker,
    quantity = 1,
    bidPrice
}) => {
    console.log('limit selling', ticker);

    const {
        currentPrice,
        instrument
    } = (await lookup(Robinhood, ticker));
    bidPrice = bidPrice || currentPrice;

    bidPrice = +(Number(bidPrice).toFixed(2));

    var options = {
        type: 'limit',
        quantity: Math.round(quantity),
        bid_price: bidPrice,
        instrument: {
            url: instrument,
            symbol: ticker
        }
        // Optional:
        // time: String,    // Defaults to "immediate"
        // type: String     // Defaults to "market"
    };

    console.log(options);
    const res = await Robinhood.place_sell_order(options);
    // console.log('limit sell response', res);
    return res;
};
