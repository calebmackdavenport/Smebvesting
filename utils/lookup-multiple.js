const chunkApi = require('./chunk-api');

const lookupMultiple = async (Robinhood, tickersToLookup, detailedQuote) => {
    // takes in array of tickers
    // returns object of tickers and current prices
    let quotes = await chunkApi(
        tickersToLookup,
        async (tickerStr) => {
            const url = `https://api.robinhood.com/quotes/?symbols=${tickerStr}`;
            const { results } = await Robinhood.url(url);
            return results;
        },
        1630
    );
    // console.log(quotes, 'quotes')
    const tickerLookups = {};
    quotes.forEach(quote => {
        if (!quote) return;
        const {symbol, last_trade_price, last_extended_hours_trade_price, ask_price } = quote;
        tickerLookups[symbol] = detailedQuote ? {
            lastTradePrice: Number(last_trade_price),
            afterHoursPrice: Number(last_extended_hours_trade_price),
            askPrice: Number(ask_price)
        } : Number(last_trade_price);
    });
    return tickerLookups;
};

module.exports = lookupMultiple;