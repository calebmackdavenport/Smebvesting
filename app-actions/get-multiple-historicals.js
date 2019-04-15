const chunkApi = require('../utils/chunk-api');
const getTrend = require('../utils/get-trend');

module.exports = async (Robinhood, tickers, qs = 'interval=day') => {

    const allHistoricals = await chunkApi(
        tickers,
        async (tickerStr) => {
                const {
                    results
                } = await Robinhood.url(`https://api.robinhood.com/quotes/historicals/?symbols=${tickerStr}&${qs}`);
                return results;
            },
            75
    );

    return allHistoricals.map(obj => {

        let prevClose;
        return obj ? obj.historicals.map(hist => {
            ['open_price', 'close_price', 'high_price', 'low_price'].forEach(key => {
                hist[key] = Number(hist[key]);
            });
            if (prevClose) {
                hist.trend = getTrend(hist.close_price, prevClose);
            }
            prevClose = hist.close_price;
            return hist;
        }) : [];

    });


};
