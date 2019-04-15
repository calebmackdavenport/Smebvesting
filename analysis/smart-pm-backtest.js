// backtest smart-pms to decide what is the optimal daysBack and numChunks inputs
// based upon a given number of days
const fs = require('mz/fs');
const jsonMgr = require('../utils/json-mgr');
const { avgArray } = require('../utils/array-math');
const Combinatorics = require('js-combinatorics');
const smartPms = require('./smart-pms');
const mapLimit = require('promise-map-limit');

const perms = {
    daysBack: [2, 3, 4],
    numChunks: [1, 2, 3, 4, 5, 6]
};

module.exports = async (
    Robinhood,
    numDays = 5, // number of days to backtest
) => {

    let files = await fs.readdir('./json/pm-perfs');

    let sortedFiles = files
        .map(f => f.split('.')[0])
        .sort((a, b) => new Date(a) - new Date(b));


    const lastDay = sortedFiles.pop();
    console.log(sortedFiles, numDays)
    const toBacktest = sortedFiles.slice(0 - numDays);

    console.log('toBacktest', toBacktest);
    console.log('lastDay', lastDay);

    cp = Combinatorics.cartesianProduct(perms.daysBack, perms.numChunks);
    console.log(cp.toArray());

    const comboPerfs = [];
    for (let combo of cp.toArray()) {
        const [daysBack, numChunks] = combo;
        console.log('daysBack', daysBack, 'numChunks', numChunks);

        let index = 0;
        const followingDayPerfs = await mapLimit(toBacktest, 1, async (day) => {
            console.log('Backtesting', day);
            const ignoreDays = numDays - index;
            const output = await smartPms(Robinhood, daysBack, numChunks, ignoreDays);
            if (!output.length) {
                console.log('no output length');
                return null;
            }
            const topCombo = output[0].pmList;
            const nextDay = toBacktest[index + 1] || lastDay;
            const nextDayPmPerfs = await jsonMgr.get(`./json/pm-perfs/${nextDay}.json`);
            const followingDayTrends = topCombo.map(pm => {
                const foundPerf = nextDayPmPerfs.find(pmObj => pmObj.pm === pm);
                return foundPerf ? Number(foundPerf.avgTrend.slice(0, -1)) : null;
            });
            index++;
            return {
                pmPerfs: followingDayTrends,
                avg: avgArray(followingDayTrends.filter(val => !!val))
            };
        });

        const pmPerfs = followingDayPerfs.map(perf => perf.pmPerfs);
        const avgs = followingDayPerfs.map(perf => perf.avg);
        const backtestOutput = {
            settings: {
                daysBack,
                numChunks
            },
            pmPerfs,
            avgs,
            avgPerf: avgArray(avgs.filter(val => !!val))
        };

        comboPerfs.push(backtestOutput);
        console.log(avgs);
        console.log('avg perf: ', backtestOutput.avgPerf)
        console.log('----------------')
    }

    const topRecommendations = comboPerfs
        .sort((a, b) => b.avgPerf - a.avgPerf)
        .slice(0, 3);

    console.log(JSON.stringify(topRecommendations, null, 2));
};
