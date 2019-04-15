// app-actions
const getMultipleHistoricals = require('../../app-actions/get-multiple-historicals');
const strategy = require('./strategy');

module.exports = {
    trendFilter: async (Robinhood, trend) => {

        const addTrendWithHistoricals = async (trend, interval, span) => {
            // add historical data
            let allHistoricals = await getMultipleHistoricals(
                Robinhood,
                trend.map(buy => buy.ticker),
                `interval=${interval}&span=${span}`
            );
    
            let withHistoricals = trend.map((buy, i) => ({
                ...buy,
                [`${span}Historicals`]: allHistoricals[i]
            }));
    
            return withHistoricals;
        };

        const trendWithHistoricals = (await addTrendWithHistoricals(trend, 'day', 'year'))
            .filter(buy => buy.yearHistoricals && buy.yearHistoricals.length);
            
        return strategy(trendWithHistoricals);

    },
    run: [4, 95, 180, 250, 345],
    trendFilterKey: ['under5', 'sp500'],
    name: 'only-up'
};