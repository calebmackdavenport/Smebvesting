const getRelatedHistorical = (historicals, daysBack) => {
    const d = new Date();
    d.setDate(d.getDate() - daysBack);

    let foundHistorical;
    historicals.some(data => {
        if (new Date(data.begins_at) > d) {
            foundHistorical = data;
            return true;
        }
    });
    return foundHistorical;
};

const trendingUp = async (Robinhood, ticker, days) => {
    try {

        const quoteData = await Robinhood.quote_data(ticker);
        let {
            previous_close: prevClose
        } = quoteData.results[0];

        const mustMatch = Array.isArray(days) ? days : [days];

        const historicalDailyUrl = `https://api.robinhood.com/quotes/historicals/${ticker}/?interval=day`;
        let {
            historicals
        } = await Robinhood.url(historicalDailyUrl);

        if (!historicals.length) {
            return null;
        }

        return mustMatch.every(period => {
            const trendingUpPeriod = Number(getRelatedHistorical(historicals, period).close_price) < Number(prevClose);
            return trendingUpPeriod;
        });

    } catch (e) {
        return null;
    }

};

module.exports = trendingUp;
