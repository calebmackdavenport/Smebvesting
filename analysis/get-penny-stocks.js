const getTrendAndSave = require('../app-actions/get-trend-and-save');

module.exports = async (Robinhood) => {
    let trend = await getTrendAndSave(Robinhood);
    const pennies = trend
        .filter(stock => {
            return Number(stock.last_trade_price) < 1;
        })
        .sort((a, b) => Number(a.last_trade_price) - Number(b.last_trade_price))
        .map(({ticker, last_trade_price}) => ({
            ticker,
            price: last_trade_price
        }));
    console.log(JSON.stringify(pennies, null, 2))
    return pennies;
};
