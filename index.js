require('./utils/fix-locale-date-string');

const login = require('./rh-actions/login');
const initModules = require('./app-actions/init-modules');

const getAllTickers = require('./rh-actions/get-all-tickers');
const cancelAllOrders = require('./rh-actions/cancel-all-orders');
const logPortfolioValue = require('./app-actions/log-portfolio-value');

let Robinhood, allTickers;

const regCronIncAfterSixThirty = require('./utils/reg-cron-after-630');

/* 
    Comment out mongo lines if you just want this to email you or automatically invest.
    Mongo is used to save reporting data so you can make educated decisions and invest in stocks manually.
*/
const mongoose = require('mongoose');
const { mongoConnectionString } = require('./config');
mongoose.connect(mongoConnectionString, { useNewUrlParser: true });

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

(async () => {

    Robinhood = await login();
    global.Robinhood = Robinhood;

    require('./socket-server');
    try {
        allTickers = require('./json/stock-data/allStocks');
    } catch (e) {
        allTickers = await getAllTickers(Robinhood);
    }
    allTickers = allTickers
        .filter(stock => stock.tradeable)
        .map(stock => stock.symbol);

    await cancelAllOrders(Robinhood);

    try {
        await logPortfolioValue(Robinhood);
    } catch (e) {
        console.log(e);
    }

    await initModules(Robinhood);
    console.log(regCronIncAfterSixThirty.toString());

    const accounts = await Robinhood.accounts();
    const cashAvailable = Number(accounts.results[0].margin_balances.unallocated_margin_cash);
    console.log({
        cashAvailable
    });
})();
