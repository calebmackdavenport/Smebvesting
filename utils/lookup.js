// lookup ticker last trade price

const { lookup } = require('yahoo-stocks');
const formatQuoteData = require('./format-quote-data');

module.exports = async (Robinhood, ticker) => {
    console.log('looking up', ticker);
    const quoteDataResponse = await Robinhood.quote_data(ticker);
    const originalQuoteData = quoteDataResponse.results[0];
    
    // add yahoo price
    try {
        var yahooPrice = (await lookup(ticker)).currentPrice;
    } catch (e) {}

    const finalLookupObj = {
        ...formatQuoteData(originalQuoteData),
        yahooPrice
    };

    // console.log(data, 'data');
    return finalLookupObj;
};
