// calculates days and loads strat-perfs into stratObj
const StratPerf = require('../../models/StratPerf');

module.exports = async (daysBack) => {

    console.log('initing strat-perfs')

    let dates = await StratPerf.getUniqueDates();
    let datesOfInterest = dates.slice(0 - daysBack);
    console.log('selected days', datesOfInterest, dates);

    const stratObj = {};
    for (let date of datesOfInterest) {
        const dayStrats = await StratPerf.getByDate(date);
        stratObj[date] = dayStrats;
    }

    console.log('loaded strats into memory');

    return {
        days: dates,
        stratObj
    };

};
