// console.log(stocks);
const login = require('../rh-actions/login');

const logPortfolioValue = require('../app-actions/log-portfolio-value');

let Robinhood, allTickers;

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

(async () => {

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

})();
