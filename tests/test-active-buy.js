const login = require('../rh-actions/login');

const logPortfolioValue = require('../app-actions/log-portfolio-value');
const activeBuy = require('../app-actions/active-buy');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

module.exports = async Robinhood => {

    Robinhood = await login();
    global.Robinhood = Robinhood;

    try {
        await logPortfolioValue(Robinhood);
    } catch (e) {
        console.log(e);
    }

    const accounts = await Robinhood.accounts();
    const cashAvailable = Number(accounts.results[0].margin_balances.unallocated_margin_cash);
    console.log(accounts, cashAvailable);

    await activeBuy(Robinhood, {
        ticker: 'BPMX',
        strategy: 'testing',
        maxPrice: 1,
        min: 242
    });

};
