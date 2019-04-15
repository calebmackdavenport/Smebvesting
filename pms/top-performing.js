const brain = require('brain.js');
const {
    avgArray
} = require('../utils/array-math');
const stratPerfOverall = require('../analysis/strategy-perf-overall');
const {
    uniqifyArray
} = require('../utils/uniqify-stuff');
const StratPerf = require('../models/StratPerf');

const uniqifyObj = obj => {
    const removeCheapest = arr => arr
        .filter(strat => !strat.includes('cheapest-picks'));
    return Object.keys(obj).reduce((acc, val) => {
        if (!obj[val][0]) {
            console.log('UH OH');
            console.log(obj[val], 'val');
            console.log(obj);
        }
        const allStrategyNames = obj[val].map(stratObj => stratObj.name);
        const filtered = removeCheapest(allStrategyNames);
        return {
            ...acc,
            [val]: filtered,
            [`${val}-uniq`]: uniqifyArray(filtered)
        };
    }, {});
};

const predictForDays = async (days, filterFn) => {

    console.log('days', days);
    const stratPerfsTrend = {};
    for (let file of days) {
        const obj = await StratPerf.getByDate(file);
        if (!obj['next-day-9']) continue;
        console.log('found', file, obj['next-day-9'].length);
        obj['next-day-9'].forEach(({
            strategyName,
            avgTrend
        }) => {
            stratPerfsTrend[strategyName] = (stratPerfsTrend[strategyName] || []).concat([avgTrend]);
        });
    }

    console.log(stratPerfsTrend);
    console.log('stratPerfsTrend')

    const predictStrategy = (trends) => {

        if (trends.length <= 1) return null;

        const trainingObjs = (() => {
            const arr = [];
            for (let i = 0; i < trends.length - 1; i++) {
                arr.push({
                    input: trends.slice(0, i + 1).map(n => Number(n)),
                    output: {
                        outputTrend: [Number(trends[i + 1])]
                    }
                });
            }
            return arr;
        })();

        const net = new brain.NeuralNetwork();
        net.train(trainingObjs);
        const prediction = net.run(trends);
        return prediction.outputTrend;
    };

    let toPredict = Object.keys(stratPerfsTrend);
    if (filterFn) {
        toPredict = toPredict.filter(strategyName => filterFn(stratPerfsTrend[strategyName]));
    }
    console.log('topredict count', toPredict.length);

    const allPredictions = toPredict
        .map((stratName, i, array) => {
            const weighted = stratPerfsTrend[stratName]
                .filter(trend => trend < 80)
                .map((trend, i) => Array(i + 1).fill(trend))
                .reduce((a, b) => a.concat(b), [])
            return {
                name: stratName,
                myPrediction: avgArray(weighted),
                brainPrediction: predictStrategy(stratPerfsTrend[stratName]),
                trend: weighted
            };
        });

    console.log('dayssss', days);
    console.log('allPredictions', JSON.stringify(allPredictions, null, 2));
    return {
        myPredictions: allPredictions
            .slice(0)
            .sort((a, b) => Number(b.myPrediction) - Number(a.myPrediction))
            .slice(0, 60),
        brainPredictions: allPredictions
            .slice(0)
            .sort((a, b) => Number(b.brainPrediction) - Number(a.brainPrediction))
            .slice(0, 60),
    };

};

const predictCurrent = async (numDays, filterFn, skipYesterday) => {
    console.log('predict current', numDays);
    let allDays = await StratPerf.getUniqueDates();
    if (skipYesterday) allDays.pop();
    const forDays = numDays ? allDays.slice(0 - numDays) : allDays;
    const prediction = await predictForDays(forDays, filterFn);
    return uniqifyObj(prediction);
};

const stratPerfPredictions = async (Robinhood, includeToday, numDays, minCount) => {
    const stratPerfData = await stratPerfOverall(Robinhood, includeToday, numDays, minCount);
    return uniqifyObj({
        ...Object.keys(stratPerfData).reduce((acc, key) => ({ // slice first 60 or else the same for each key
            [key]: stratPerfData[key].slice(0, 60),
            ...acc,
        }), {}),
        topPerformers85: stratPerfData.sortedByAvgTrend
            .filter(strat => strat.percUp > 0.85 && strat.avgTrend > 1.6)
            .slice(0, 60),
        topPerformers95: stratPerfData.sortedByAvgTrend
            .filter(strat => strat.percUp > 0.95 && strat.avgTrend > 1.3)
            .slice(0, 60)
    });
};


module.exports = async (Robinhood) => {
    return {
        ...await predictCurrent(8),
        ...await stratPerfPredictions(Robinhood, true, 10, 1)
    };
};