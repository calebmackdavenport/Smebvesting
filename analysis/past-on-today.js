// look at strategy perf overall
// how would the top strategies perform if bought today?

const stratPerfOverall = require('./strategy-perf-overall');
const stratPerfToday = require('./strategy-perf-today');

module.exports = async (Robinhood) => {
    const overall = await stratPerfOverall(Robinhood, false, 6, 4);
    const today = await stratPerfToday(Robinhood);
    console.log(overall, today);

    let results = {};

    Object.keys(overall).forEach(breakdown => {
        const top10 = overall[breakdown]
            .filter(stratPerf => !stratPerf.name.includes('cheapest-picks'))
            .slice(0, 10)
            .map(stratPerf => stratPerf.name);
        addStrategiesToResults(breakdown, top10);
    });
    return results;
};
