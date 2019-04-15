// pass in strategies
// return list of days

const fs = require('mz/fs');
const stratPerfMultiple = require('./strategy-perf-multiple');
const manualPms = require('../pms/manual');
const flatten = require('../utils/flatten-array');

const getFilesSortedByDate = require('../utils/get-files-sorted-by-date');

module.exports = async (Robinhood, daysBack, ...pms) => {

    const strategies = flatten(pms.map(pm => manualPms[pm]));
    console.log('pms', pms);
    console.log('strategies', strategies)
    const stratPerfs = await stratPerfMultiple(Robinhood, daysBack, ...strategies);

    const allDays = await getFilesSortedByDate('prediction-models');

    const dailyRoundup = allDays.reduce((acc, day) => ({
        ...acc,
        [day]: (() => {
            const foundMatches = [];
            stratPerfs.forEach(stratPerf => {
                const foundMatch = stratPerf.allDays.find(({
                    date
                }) => date === day);
                foundMatch && foundMatches.push({
                    strategy: stratPerf.strategy,
                    picks: foundMatch.picks,
                    maxUp: foundMatch.maxUp
                });
            });
            return foundMatches;
        })()
    }), {});

    console.log(JSON.stringify(dailyRoundup, null, 2));
};
