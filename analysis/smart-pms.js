// find best combination of first1 pm's
// using pm-perfs
const fs = require('mz/fs');
const jsonMgr = require('../utils/json-mgr');
const {
    avgArray
} = require('../utils/array-math');
const Combinatorics = require('js-combinatorics');

const excuseDays = [
    '5-1-2018'
];

module.exports = async (Robinhood, daysBack = 5, numChunks = 3, ignoreDays = 0) => {

    console.log('daysBack', daysBack);
    console.log('numChunks', numChunks);
    console.log('ignoreDays', ignoreDays);
    let files = await fs.readdir('./json/pm-perfs');

    let sortedFiles = files
        .map(f => f.split('.')[0])
        .slice(0, ignoreDays ? 0 - ignoreDays : Math.Infinity)
        .sort((a, b) => new Date(a) - new Date(b));

    const filesOfInterest = sortedFiles.slice(0 - daysBack);

    console.log(filesOfInterest);

    const pmCache = {};
    for (let file of filesOfInterest) {
        const json = await jsonMgr.get(`./json/pm-perfs/${file}.json`);
        json.forEach(({
            pm,
            avgTrend
        }) => {
            if (pm.includes('forPurchase')) return;
            pmCache[pm] = pmCache[pm] || {};
            pmCache[pm] = {
                ...pmCache[pm],
                [file]: Number(avgTrend.slice(0, -1))
            };
        });
    }

    console.log(JSON.stringify(pmCache, null, 2));

    const daysVals = [];

    const pms = Object.keys(pmCache);
    if (Number(numChunks) > pms.length) {
        return null;
    }
    const cmb = Combinatorics.bigCombination(pms, Number(numChunks));
    while (a = cmb.next()) {
        console.log(a);
        const trends = filesOfInterest.map(day => {
            return a.map(pm => pmCache[pm][day]);
        });
        const avgTrends = trends.map(ts => avgArray(ts.filter(val => !!val)))
        const avgOfAvgs = avgArray(avgTrends.filter(val => !!val));
        daysVals.push({
            pmList: a,
            trends,
            avgTrends,
            avgOfAvgs
        });
    }

    return daysVals
        .filter(dayVal => { // half of the trends half to not be null / undefined
            return dayVal.trends.every((ts, index) => {
                const numNull = ts.filter(t => t === undefined).length;
                const numTotal = ts.length;
                const meetsNullCheck = numNull < numTotal / 2;
                if (!meetsNullCheck) {
                    const relatedDay = filesOfInterest[index];
                    if (excuseDays.includes(relatedDay)) {
                        return true;
                    }
                }
                return meetsNullCheck;
            });
        })
        .sort((a, b) => b.avgOfAvgs - a.avgOfAvgs)
        .slice(0, 5);
};
