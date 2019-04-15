const fs = require('mz/fs');
const jsonMgr = require('../utils/json-mgr');
const { avgArray } = require('../utils/array-math');
const stratManager = require('../socket-server/strat-manager');

module.exports = async (Robinhood, daysBack, minCount = 2, includeToday = true, ...searchString) => {
    daysBack = typeof daysBack !== undefined ? Number(daysBack) : 5;

    let files = await fs.readdir('./json/pm-perfs');

    let sortedFiles = files
        .map(f => f.split('.')[0])
        .sort((a, b) => new Date(a) - new Date(b));
    
    const filesOfInterest = daysBack ? sortedFiles.slice(0 - daysBack) : [];

    console.log({ daysBack, includeToday, filesOfInterest});


    const pmCache = {};
    const addTrend = (pm, trend) => {
        pmCache[pm] = (pmCache[pm] || []).concat(
            Number(trend)
        );
    };

    for (let file of filesOfInterest) {
        const json = await jsonMgr.get(`./json/pm-perfs/${file}.json`);
        json.forEach(data => {
            const { pmName, avgTrend } = data;
            console.log({ pmName, avgTrend });
            if (!pmName || !avgTrend) return;
            addTrend(pmName, avgTrend);
        });
    }

    if (includeToday) {
        await stratManager.init();
        const pmPerfs = stratManager.calcPmPerfs();
        pmPerfs.forEach(({ pmName, avgTrend }) => {
            addTrend(pmName, avgTrend);
        });
    }

    console.log({pmCache});

    const pmAnalysis = {};
    Object.keys(pmCache).forEach(key => {
        const trends = pmCache[key].filter(t => Math.abs(t) < 50);
        const weighted = trends
            .map((trend, i) => Array(i+1).fill(trend))
            .reduce((a, b) => a.concat(b), []);
        pmAnalysis[key] = {
            avgTrend: avgArray(trends),
            // weighted,
            weightedTrend: avgArray(weighted),
            percUp: trends.filter(t => t > 0).length / trends.length,
            hundredResult: trends.reduce((acc, val) => {
                return acc * (100 + val) / 100;
            }, 100),
            trends
        };
    });

    console.log({pmAnalysis});

    let sortedArray = Object.keys(pmAnalysis)
        .map(pm => ({
            pm,
            ...pmAnalysis[pm],
        }))
        .map(pm => ({
            ...pm,
            smebScore: (pm.weightedTrend * pm.percUp) + Math.min(...pm.trends) + pm.trends.filter(t => t > 3 && t < 10).length
        }));

    console.log({ searchString })
    if (searchString.length) {
        sortedArray = sortedArray.filter(t => searchString.every(p => t.pm.includes(p)));
    }
        
    console.log(sortedArray.length, 'backa', minCount)
    sortedArray = sortedArray
        .filter(t => t.trends.length >= Number(minCount))
        .sort((a, b) => {
            if (!a.smebScore) {
                return 1;
            } else if (!b.smebScore) {
                return -1;
            }
            return b.smebScore - a.smebScore;
        })

    return sortedArray;
};
