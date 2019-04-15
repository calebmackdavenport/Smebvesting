const TickerWatcher = require('./ticker-watcher');
const getMultipleHistoricals = require('../app-actions/get-multiple-historicals');

const getHistoricalData = async (tickers) => {
    let histQS = `interval=5minute`;

    let allHistoricals = await getMultipleHistoricals(
        Robinhood,
        tickers,
        histQS
    );

    let withHistoricals = tickers.reduce((acc, ticker, i) => ({
        [ticker]: allHistoricals[i],
        ...acc
    }), {});

    return withHistoricals;
}


class HistoricalTickerWatcher extends TickerWatcher {
    constructor({
        name,
        Robinhood,
        handler,
        timeout,
        runAgainstPastData,
        onPick,
        onEnd
    }) {
        super({
            name,
            Robinhood,
            handler,
            timeout,
            onPick
        });

        this.iteration = 0;
        this.priceCache = {};
        this.timeout = timeout;
        this.onEnd = onEnd;
        this.handler = relatedPrices => {
            Object.keys(relatedPrices).forEach(ticker => {
                const related = relatedPrices[ticker];
                this.priceCache[ticker] = [
                    ...this.priceCache[ticker] || [],
                    related
                ];
            });
            return handler(this.priceCache);
        }
        console.log({
            runAgainstPastData
        })
        this.runAgainstPastData = runAgainstPastData;
        this.disableOnPick = runAgainstPastData;
        this.historicals = {};

    }
    clearPriceCache() {
        console.log("clearing price cache");
        this.priceCache = {};
    }
    async addTickers(tickers) {
        console.log('adding tickers', tickers);
        if (this.runAgainstPastData) {
            this.historicals = {
                ...this.historicals,
                ...await getHistoricalData(tickers)
            };
        }
        super.addTickers(tickers);
    }
    async lookupRelatedPrices() {
        if (!this.runAgainstPastData) {
            return super.lookupRelatedPrices();
        }
        const {
            Robinhood,
            tickersWatching,
            handler,
            iteration,
            historicals,
            allPicks
        } = this;
        if (!historicals) return;
        let outOfData = false;
        const prices = tickersWatching
            .filter(ticker => historicals[ticker])
            .reduce((acc, ticker) => {
                const relatedHist = historicals[ticker][iteration] || {};
                if (!relatedHist.close_price && historicals[ticker][iteration - 1] && historicals[ticker][iteration - 1].close_price) {
                    outOfData = true;
                }
                return {
                    ...acc,
                    [ticker]: {
                        lastTradePrice: relatedHist.close_price,
                        timestamp: new Date(relatedHist.begins_at)
                    }
                };
            }, {});
        if (outOfData) {
            console.log('out of data, stopping')
            this.stop();
            return this.onEnd(allPicks);
        }
        console.log('increasied iteration')
        this.iteration++;
        const newPicks = await handler(prices);
        this.handlePicks(newPicks);
    }
}

module.exports = HistoricalTickerWatcher;