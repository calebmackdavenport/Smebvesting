const getTrendAndSave = require('../app-actions/get-trend-and-save');
const mapLimit = require('promise-map-limit');
const getUpStreak = require('../app-actions/get-up-streak');
const getTrend = require('../utils/get-trend');

module.exports = async (Robinhood) => {
    let trend = await getTrendAndSave(Robinhood);

    trend = await addOvernightJumpAndTSO(Robinhood, trend);


    let cheapBuys = trend
        .filter(stock => {
            return stock.quoteData.lastTrade > 5 && stock.quoteData.lastTrade < 6;
        });

    console.log('getting historicals')

    let curIndex = 0;
    cheapBuys = await mapLimit(cheapBuys, 20, async buy => {

        if (curIndex % Math.floor(cheapBuys.length / 10) === 0) {
            console.log('historical', curIndex, 'of', cheapBuys.length);
        }
        curIndex++;

        let prehistoricals = buy.historicals || [];

        let index = 0;
        let historicals = await mapLimit(prehistoricals, 1, async hist => {


            console.log('about to get upstreak', hist);
            const upstreak = await getUpStreak(
                Robinhood,
                buy.ticker,
                prehistoricals.slice(0, index)
            );

            index++;
            return {
                ...hist,
                ticker: buy.ticker,
                trend: getTrend(hist.close_price, hist.open_price),
                upstreak
            };

        });

        return {
            ...buy,
            historicals
        };

    });

    const top10volPerDay = {};
    cheapBuys.forEach(buy => {
        buy.historicals.forEach(hist => {
            let d = new Date(hist.begins_at);
            d.setDate(d.getDate() + 1);
            d = d.toLocaleDateString().split('/').join('-');
            if (
                (getTrend(hist.close_price, hist.open_price) > 10) ||
                (hist.upstreak === 0)
            ) return;

            top10volPerDay[d] = (top10volPerDay[d] || []).concat({
                ticker: hist.ticker,
                volume: hist.volume
            });
        });
    });

    Object.keys(top10volPerDay).forEach(d => {
        top10volPerDay[d] = top10volPerDay[d]
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 10);
    });


    console.log('\n top10volPerDay');

    Object.keys(top10volPerDay)
        .sort((a, b) => new Date(a) - new Date(b))
        .slice(0, Object.keys(top10volPerDay).length - 1)
        .forEach(key => {
            console.log('------------------');
            console.log('key', key);
            console.log('------------------');

            top10volPerDay[key].map((vol, i) => {

                const relBuy = cheapBuys.find(buy => buy.ticker === vol.ticker);
                const folDay = relBuy.historicals.findIndex(hist => {
                    let d = new Date(hist.begins_at);
                    d.setDate(d.getDate() + 1);
                    d = d.toLocaleDateString().split('/').join('-');
                    return d === key;
                });

                const followingDay = relBuy.historicals[folDay + 1];

                const returnObj = {
                    ...vol,
                    followingDay
                };

                console.log(JSON.stringify(returnObj, null, 2));
                return returnObj;
            });

        });

};
