const analyzeDay = require('./analyze-day');
const playouts = require('./playouts');

const {
    avgArray,
    percUp,
    hundredResult
} = require('../../utils/array-math');

const {
    orderBreakdownKeys
} = require('../../utils/breakdown-key-compares');

const runPlayout = (playoutObj, breakdowns) => {

    const {
        type,
        fn: playoutFn
    } = playoutObj;

    const outcomes = breakdowns.map(playoutFn);
    const onlyValues = outcomes
        .map(o => o.value)
        .filter(v => Math.abs(v) < 50);
    const onlyHits = outcomes.filter(o => o.hitFn);
    return {
        percUp: percUp(onlyValues),
        avgTrend: avgArray(onlyValues),
        hundredResult: hundredResult(onlyValues),
        ...(type === 'individualFn' && {
            percHitPlayout: onlyHits.length / outcomes.length,
            percHitsPositive: onlyHits.filter(o => o.value > 0).length / onlyHits.length,
        }),
    };
};

const analyzeStrategy = ({
    strategyName,
    stratObj,
    detailed = false,
    maxBreakdownKey
}) => {

    const analyzed = Object.keys(stratObj)
        .map(date => analyzeDay({
            strategyName,
            stratPerf: stratObj[date],
            date,
            maxBreakdownKey
        }))
        .filter(value => !!value);

    const withoutErrors = analyzed
        .filter(value => !value.notEnoughError);

    const daysDown = withoutErrors
        .filter(v => !v.didGoUp)

    const breakdownsByDay = withoutErrors.map(obj => {
        const breakdownKeys = Object.keys(obj.breakdowns);
        const orderedKeys = orderBreakdownKeys(breakdownKeys);
        const breakdowns = orderedKeys.map(k => obj.breakdowns[k]);
        return breakdowns;
    });

    return {
        strategy: strategyName,
        percUp: withoutErrors.filter(a => a.didGoUp).length / withoutErrors.length,
        count: withoutErrors.length,

        maxs: withoutErrors.map(a => a.maxUp),

        ...(detailed ? (() => {

            const breakdownRoundup = withoutErrors.reduce((acc, obj) => {
                const {
                    breakdowns
                } = obj;
                Object.keys(breakdowns).forEach(key => {
                    acc[key] = (acc[key] || []).concat(breakdowns[key]);
                });
                return acc;
            }, {});

            const breakdownStats = {};
            orderBreakdownKeys(Object.keys(breakdownRoundup)).forEach(key => {
                const filteredVals = breakdownRoundup[key].filter(t => Math.abs(t) < 50);
                breakdownStats[key] = {
                    avg: avgArray(filteredVals),
                    percUp: percUp(filteredVals)
                }
            });

            return {
                allDays: withoutErrors,
                daysDown: daysDown,
                bigDays: withoutErrors.filter(v => v.maxUp > 50),
                breakdowns: breakdownStats,
                hundredResult: hundredResult(withoutErrors.map(obj => obj.maxUp))
            };

        })() : {
            daysDown: daysDown.length,
        }),

        playouts: Object.keys(playouts).reduce((acc, k) => ({
            ...acc,
            [k]: runPlayout(playouts[k], breakdownsByDay)
        }), {})
    };

};

module.exports = analyzeStrategy;
