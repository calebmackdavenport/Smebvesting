const fs = require('mz/fs');

const Pick = require('../models/Pick');
const StratPerf = require('../models/StratPerf');

const getTrend = require('../utils/get-trend');
const {
    avgArray
} = require('../utils/array-math');
const {
    filterByTradeable
} = require('../utils/filter-by-tradeable');
const lookupMultiple = require('../utils/lookup-multiple');

const analyzeDay = async (Robinhood, day) => {
    console.log('analyzeDay');
    let pickObjs = await Pick.find({
        date: day
    });
    console.log(`analyzing ${day}: ${pickObjs.length} strategies`);

    let tickerLookups = {};
    const strategyPicks = {};

    // load data from picks-data and keep track of tickers to lookup
    pickObjs.forEach(pickObj => {
        strategyPicks[`${pickObj.strategyName}-${pickObj.min}`] = pickObj;
        const tickers = pickObj.picks.map(p => p.ticker);
        tickers.forEach(t => {
            tickerLookups[t] = null;
        });
    });

    // lookup prices of all tickers (chunked)
    const tickersToLookup = Object.keys(tickerLookups);

    tickerLookups = await lookupMultiple(Robinhood, tickersToLookup);

    // calc trend and avg for each strategy-min
    const withTrend = [];
    pickObjs.forEach(pickObj => {
        const picks = pickObj.picks
            .filter(({
                ticker
            }) => filterByTradeable([ticker]).length);
        const picksWithTrend = picks.map(({
            ticker,
            price
        }) => ({
            ticker,
            thenPrice: price,
            nowPrice: tickerLookups[ticker],
            trend: getTrend(tickerLookups[ticker], price)
        }));
        withTrend.push({
            strategyName: pickObj.strategyName,
            min: pickObj.min,
            avgTrend: avgArray(picksWithTrend.map(pick => pick.trend)),
            picks: picksWithTrend.map(t => t.ticker).join(', ')
        });
    });

    const sortedByAvgTrend = withTrend
        .filter(trend => trend.avgTrend)
        .sort((a, b) => b.avgTrend - a.avgTrend);

    return sortedByAvgTrend;

};

module.exports = {
    analyzeDay,
    default: async (Robinhood, min) => {
        const distinctDates = await Pick.find().distinct('date');

        let sortedFolders = distinctDates.sort((a, b) => {
            return new Date(a) - new Date(b);
        });

        const perms = {
            'next-day': 2,
            'second-day': 3,
            'third-day': 4,
            ...(min === 9 && {
                'fourth-day': 5
            })
        };

        for (let [key, daysBack] of Object.entries(perms)) {

            const pastDayDate = sortedFolders[sortedFolders.length - daysBack];
            if (!pastDayDate) {
                console.log(key, 'not enough picks-data to analyze within record-strat-perfs.');
                break;
            }
            const analyzed = await analyzeDay(Robinhood, pastDayDate);
            const period = `${key}-${min}`;
            console.log('done analyzing', pastDayDate, analyzed);
            await StratPerf.bulkWrite(
                analyzed.map(stratPerf => ({
                    updateOne: {
                        filter: {
                            date: pastDayDate,
                            stratMin: `${stratPerf.strategyName}-${stratPerf.min}`
                        },
                        update: {
                            '$push': {
                                perfs: {
                                    period,
                                    avgTrend: stratPerf.avgTrend
                                }
                            }
                        },
                        upsert: true
                    }
                }))
            );
            console.log(key, 'saved strat-perf');
        };
        console.log('done saving strat-perfs!');
    }

};
