// utils
const chunkApi = require('../utils/chunk-api');

const fundamentalCache = {};
const REFRESH_CACHE = 1000 * 60;

module.exports = async (Robinhood, trend) => {

    const allTickers = trend.map(t => t.ticker);
    const tickersInCache = allTickers.filter(ticker =>
        Object.keys(fundamentalCache).includes(ticker)
    );
    const tickersInCacheAndNotExpired = tickersInCache.filter(ticker =>
        Date.now() - fundamentalCache[ticker].timestamp < REFRESH_CACHE
    );

    const tickersToLookup = allTickers.filter(ticker =>
        !tickersInCacheAndNotExpired.includes(ticker)
    );

    console.log('adding fundamentals')
    let fundamentals = await chunkApi(
        tickersToLookup,
        async tickerStr => {
                // console.log('tickerstr', tickerStr);
                const {
                    results
                } = await Robinhood.url(`https://api.robinhood.com/fundamentals/?symbols=${tickerStr}`);
                return results;
            },
            10
    );

    fundamentals.forEach((data, i) => {
        const ticker = tickersToLookup[i];
        fundamentalCache[ticker] = {
            timestamp: Date.now(),
            data
        };
    });

    let withFundamentals = trend.map(obj => ({
        ...obj,
        fundamentals: fundamentalCache[obj.ticker].data
    }));

    return withFundamentals;

};
