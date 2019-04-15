// gets current strategy performance of picks TODAY
const {
    analyzeDay
} = require('../app-actions/record-strat-perfs');
const Pick = require('../models/Pick');

module.exports = async (Robinhood) => {
    let sortedDates = await Pick.getUniqueDates();

    console.log(sortedDates);

    let todayReport = await analyzeDay(Robinhood, sortedDates[sortedDates.length - 1]);
    todayReport = todayReport.filter(strat => !strat.strategyName.includes('-first3') && !strat.strategyName.includes('-single'));
    return todayReport;
};
