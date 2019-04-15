const getUpStreak = async (Robinhood, ticker, historicals) => {
    try {
        historicals = historicals || await (async () => {
            const historicalDailyUrl = `https://api.robinhood.com/quotes/historicals/${ticker}/?interval=day`;
            let {
                historicals
            } = await Robinhood.url(historicalDailyUrl);
            return (historicals.length) ? historicals : null;
        })();

        let lastDay;
        // console.log('of', ofInterest);
        let streakCount = 0;
        historicals.reverse().some(day => { // searching for first occurance of a non gain in 24hr
            const curLastDay = lastDay;
            lastDay = day;
            if (!curLastDay) return false;
            const wentUp = Number(curLastDay.close_price) > Number(day.close_price);
            if (wentUp) streakCount++;
            return !wentUp;
        });
        return streakCount;
    } catch (e) {
        return null;
    }
};

module.exports = getUpStreak;
