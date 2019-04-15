const activeSell = require('../app-actions/active-sell');
module.exports = async (Robinhood, ticker = 'CHK', quantity = 5) => {

    await activeSell(Robinhood, {
        ticker,
        quantity: Number(quantity)
    });
}