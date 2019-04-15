const addOvernightJumpAndTSO = require('../app-actions/add-overnight-jump-and-tso');
const mapLimit = require('promise-map-limit');
const getRisk = require('../rh-actions/get-risk');

const trendFilter = async (Robinhood, trend) => {
    // cheap stocks that are going up the most for the day

    console.log('running big-day-trend-up strategy');

    console.log('total trend stocks', trend.length);
    const withTrendSinceOpen = await addOvernightJumpAndTSO(Robinhood, trend);
    const allUp = withTrendSinceOpen.filter(
        stock => stock.trendSinceOpen && stock.trendSinceOpen > 3
    );
    console.log('trendingUp', allUp.length);


    let withDetails = await mapLimit(allUp, 20, async buy => ({
        ...buy,
        ...(await getRisk(Robinhood, buy)),
    }));

    console.log(
        'num watcout',
        withDetails.filter(buy => buy.shouldWatchout).length
    );
    console.log(
        '> 8% below max of year',
        withDetails.filter(buy => buy.percMax > -8).length
    );
    withDetails = withDetails.filter(
        buy => !buy.shouldWatchout && buy.percMax < -8
    );

    console.log('count', withDetails.length);
    const sorted = withDetails
        .sort((a, b) => b.trendSinceOpen - a.trendSinceOpen);

    const num = n => sorted
        .slice(0, n) // top five trending up
        .map(stock => stock.ticker);

    return {
        count5: num(5),
        count2: num(2),
        count1: num(1)
    };
};

const bigDayTrendUp = {
    name: 'big-day-trend-up',
    trendFilter,
};

module.exports = bigDayTrendUp;
