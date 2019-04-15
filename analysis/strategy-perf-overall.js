// gets current strategy performance of picks looking back n days
const NUM_DAYS = 2;

const {
    avgArray
} = require('../utils/array-math');

const strategyPerfToday = require('./strategy-perf-today');
const StratPerf = require('../models/StratPerf');

class HashTable {
    constructor() {
        this.hashes = {};
    }
    put(key, value) {
        this.hashes[JSON.stringify(key)] = value;
    }
    get(key) {
        return this.hashes[JSON.stringify(key)];
    }
    keys() {
        return Object.keys(this.hashes)
            .map(hash => JSON.parse(hash));
    }
    print() {
        console.log(JSON.stringify(this.hashes, null, 2));
    }
}

module.exports = async (Robinhood, includeToday, daysBack = NUM_DAYS, minCount = 0, ignoreYesterday, maxCount = Number.POSITIVE_INFINITY, stratFilter = '') => {
    console.log('includeToday', includeToday);
    console.log('days back', daysBack);
    console.log('mincount', minCount);

    const paramTrue = val => val && val.toString() === 'true';
    let dates = await StratPerf.getUniqueDates();

    if (paramTrue(ignoreYesterday)) dates.pop();
    let threeMostRecent = dates.slice(0 - daysBack);
    console.log('selected days', threeMostRecent);

    const stratResults = new HashTable();
    for (let day of threeMostRecent) {

        const dayStrats = await StratPerf.getByDate(day);
        Object.keys(dayStrats).forEach(period => {

            const sellMin = Number(period.substring(period.lastIndexOf('-') + 1));
            if (period !== 'next-day-9') return; // only consider 9 minute sell times
            dayStrats[period].forEach(stratPerf => {
                const {
                    strategyName,
                    avgTrend
                } = stratPerf;
                if (!strategyName.includes(stratFilter)) return;
                if (avgTrend > 100) return; // rudimentary filter out reverse splits's
                const negMin = strategyName.includes('--');
                const split = strategyName.split('-');
                let buyMin = Number(split.pop());
                buyMin = negMin ? 0 - buyMin : buyMin;
                let strategyWithoutMin = split.join('-');
                if (strategyWithoutMin.endsWith('-')) {
                    strategyWithoutMin = strategyWithoutMin.substring(0, strategyWithoutMin.length - 1);
                }
                const key = {
                    strategyName: strategyWithoutMin,
                    buyMin,
                    // sellMin
                };

                stratResults.put(key, (stratResults.get(key) || []).concat(avgTrend));
            });

        });
    }

    // should includetoday if not holiday
    if (paramTrue(includeToday) || typeof includeToday === 'object') {
        console.log('adding today');
        let todayPerf = typeof includeToday === 'object' ? includeToday : await strategyPerfToday(Robinhood);
        todayPerf = todayPerf.filter(p => p.strategyName.includes(stratFilter));
        todayPerf.forEach(perf => {
            let {
                strategyName,
                avgTrend,
                min
            } = perf;
            console.log({
                strategyName,
                avgTrend,
                min
            });

            const key = {
                strategyName,
                buyMin: min
            };

            stratResults.put(key, (stratResults.get(key) || []).concat(avgTrend));
        });
    }

    stratResults.keys().forEach(keyObj => {
        const arrayOfTrends = stratResults.get(keyObj);
        stratResults.put(keyObj, {
            avgTrend: avgArray(arrayOfTrends),
            count: arrayOfTrends.length,
            trends: arrayOfTrends
        });
    });

    const allPerfs = [];
    stratResults.keys().forEach(keyObj => {
        const strategyPerformance = stratResults.get(keyObj);
        allPerfs.push({
            ...keyObj,
            ...strategyPerformance
        });
    });

    const withoutPerms = allPerfs
        .filter(({
            strategyName
        }) => {
            const lastChunk = strategyName.substring(strategyName.lastIndexOf('-') + 1);
            return ![
                'first3'
            ].includes(lastChunk);
        })
        .filter(perf => perf.count >= minCount && perf.count <= maxCount);

    const withData = withoutPerms.map(({
        strategyName,
        avgTrend,
        buyMin,
        trends,
        count
    }) => ({
        name: strategyName + '-' + buyMin,
        avgTrend,
        trends: trends.map(t => Math.round(t)),
        percUp: trends.map(t => Math.round(t)).filter(t => t > 0).length / trends.length,
        hundredResult: trends.reduce((acc, val) => {
            return acc * (100 + val) / 100;
        }, 100),
        count
    }));

    const sortedByAvgTrend = withData
        .sort((a, b) => b.avgTrend - a.avgTrend)
        .slice(0);

    const sortedByPercUp = withData
        .sort((a, b) => {
            return (b.percUp == a.percUp) ? b.avgTrend - a.avgTrend : b.percUp - a.percUp;
        })
        .slice(0);

    const sortedByHundredResult = withData
        .sort((a, b) => {
            return (b.hundredResult == a.hundredResult) ? b.avgTrend - a.avgTrend : b.hundredResult - a.hundredResult;
        })
        .slice(0);

    console.log('done getting strat perf overall')

    return {
        sortedByAvgTrend,
        sortedByPercUp,
        sortedByHundredResult
    };

};
