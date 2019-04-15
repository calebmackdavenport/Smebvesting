const detailedNonZero = require('./detailed-non-zero');
const mapLimit = require('promise-map-limit');

const daysBetween = (firstDate, secondDate) => {
    var oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    var diffDays = Math.round(Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay)));
    return diffDays;
};

module.exports = async Robinhood => {
    const nonzero = await detailedNonZero(Robinhood);
    const withAge = nonzero.map(pos => ({
        ...pos,
        dayAge: daysBetween(new Date(), new Date(pos.updated_at))
    }));

    const olderThanOneDay = withAge.filter(pos => pos.dayAge > 1);

    console.log(withAge, 'total', olderThanOneDay.length, 'olderThanOneDay');

    const sellIt = async pos => {
        const sellRatio = (pos.dayAge === 2) ? 0.5 : 1;
        console.log('selling', sellRatio * 100, '% of', pos.symbol, 'age=', pos.dayAge);
    };

    const results = mapLimit(olderThanOneDay, 3, pos => {
        const waitTime = Math.random() * 1000 * 60 * 50;
        console.log('waiting', waitTime, 'for', pos.symbol);
        setTimeout(() => sellIt(pos), waitTime);
    });

    console.log('DONE selling older than a day')
};
