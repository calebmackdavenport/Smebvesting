const manualPms = require('../pms/manual');
const flatten = require('../utils/flatten-array');
const stratPerfMultiple = require('./strategy-perf-multiple');

module.exports = async (Robinhood, daysBack, ...pmNames) => {
    const pmStrats = flatten(
        pmNames.map(pm => manualPms[pm])
    );
    const stratPerf = await stratPerfMultiple(Robinhood, daysBack, ...pmStrats);

    const allStratsPerf = pmStrats
        .map(strat => {
            return stratPerf.find(perf => perf.strategy === strat);
        })
        .filter(obj => !!obj)
        .map(obj => {
            ['allDays', 'breakdowns', 'bigDays', 'playouts'].forEach(key => {
                delete obj[key];
            });
            return obj;
        });
    return allStratsPerf;
};
