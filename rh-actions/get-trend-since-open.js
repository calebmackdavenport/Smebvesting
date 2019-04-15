// pass an array of tickers or a single ticker string

// npm
const mapLimit = require('promise-map-limit');

// utils
const getTrend = require('../utils/get-trend');
const chunkApi = require('../utils/chunk-api');
const lookup = require('../utils/lookup');
const formatQuoteData = require('../utils/format-quote-data');

const formatStock = stock => {
    const {
        quote_data
    } = stock;
    const shouldFormatQD = !quote_data.lastTrade;
    const actualQD = shouldFormatQD ? formatQuoteData(quote_data) : quote_data;
    const {
        lastTrade,
        prevClose
    } = actualQD;
    const withAdditionalProps = {
        ...stock,
        symbol: stock.ticker,
        quote_data: actualQD,
        last_trade_price: lastTrade,
        previous_close: prevClose,
        trend_since_prev_close: getTrend(lastTrade, prevClose)
    };
    return withAdditionalProps;
};

const getTrendSinceOpen = {
    single: async (Robinhood, ticker) => {
        console.log('tick', ticker);
        try {
            var [fundamentals, lookup_data] = await Promise.all([
                Robinhood.fundamentals(ticker),
                lookup(Robinhood, ticker)
            ]);
            fundamentals = fundamentals.results[0];
        } catch (e) {
            console.log(e, 'error getting trend', ticker);
            return {};
        }

        const {
            open
        } = fundamentals;

        const stockObj = {
            ticker,
            fundamentals,
            quote_data: lookup_data,
            open,
        };
        return formatStock(stockObj);
    },
    multiple: async (Robinhood, stocks) => {

        console.log('multiple')
        let quotes = await chunkApi(
            stocks,
            async (tickerStr) => {
                    const {
                        results
                    } = await Robinhood.url(`https://api.robinhood.com/quotes/?symbols=${tickerStr}`);
                    return results;
                },
                1630
        );

        quotes = quotes.filter(q => !!q);

        let withQuotes = stocks.map((ticker, i) => {
            let relatedQuote = quotes.find(q => q.symbol === ticker) || {};
            const stockObj = {
                ticker,
                quote_data: relatedQuote
            };
            return formatStock(stockObj);
        });

        console.log(withQuotes, 'withQuotes');

        return withQuotes;
    }
};

module.exports = async (Robinhood, input) => {
    if (Array.isArray(input)) {
        return getTrendSinceOpen.multiple(Robinhood, input);
    } else {
        return getTrendSinceOpen.single(Robinhood, input);
    }
};
