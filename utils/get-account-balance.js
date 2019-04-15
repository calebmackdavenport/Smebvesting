const DayReport = require('../models/DayReport');
const getTrend = require('../utils/get-trend');
const jsonMgr = require('../utils/json-mgr')

const roundTo = numDec => num => Math.round(num * Math.pow(10, numDec)) / Math.pow(10, numDec);
const oneDec = roundTo(1);
const twoDec = roundTo(2);

module.exports = async (Robinhood, includeTrend, todaysDate) => {
    
    const getPrevDateBalanceFromPortfolioCache = async () => {
        const portCache = await jsonMgr.get('./portfolio-cache.json');
        let lastPortVal = Object.keys(portCache).indexOf(todaysDate);
        lastPortVal = lastPortVal === -1 ? Object.keys(portCache).length : lastPortVal;
        const vl = portCache[Object.keys(portCache)[lastPortVal - 1]];
        return vl;
    };

    const [ account ] = (await Robinhood.accounts()).results;

    // turn this on if you want to see account updates after each action (in case of buy/sell orders)
    //console.log("Robinhood account", account)
    
    const portfolio = await Robinhood.url(account.portfolio);
    const { equity, extended_hours_equity } = portfolio;

    const accountBalance = extended_hours_equity || equity;

    console.log({ equity, accountBalance });
    let returnObj = { accountBalance };

    if (includeTrend) {
        const uniqDates = await DayReport.getUniqueDates();
        const todayIndex = uniqDates.findIndex(t => t === todaysDate);
        const prevDateIndex = todayIndex === -1 ? uniqDates.length - 1 : todayIndex - 1;
        const prevDate = uniqDates[prevDateIndex];
        console.log({ todayIndex, prevDateIndex, prevDate, uniqDates });
        const prevDay = await DayReport.findOne({ date: prevDate });
        console.log({ prevDay })
        const prevBalance = prevDay ? prevDay.accountBalance : await getPrevDateBalanceFromPortfolioCache();
        console.log({ prevDay, prevBalance });
        const { adjusted_equity_previous_close } = portfolio;
        const useForYesterday = prevBalance || adjusted_equity_previous_close;
        const absoluteChange = twoDec(accountBalance - useForYesterday);
        const percChange = getTrend(accountBalance, useForYesterday);
        returnObj = {
            ...returnObj,
            accountBalanceTrend: {
                absolute: absoluteChange,
                percentage: percChange
            }
        };
    }

    return returnObj;

};