const jsonMgr = require('../utils/json-mgr');
const {
    CronJob
} = require('cron');
const fs = require('mz/fs');

// mongo
const Pick = require('../models/Pick');

// predictions and past data
const stratPerfOverall = require('../analysis/strategy-perf-overall');
const createPredictionModels = require('./create-prediction-models');

const getTrend = require('../utils/get-trend');
const {
    avgArray
} = require('../utils/array-math');
const sendEmail = require('../utils/send-email');
const regCronIncAfterSixThirty = require('../utils/reg-cron-after-630');
const cachedPositions = require('../utils/cached-positions');
const flatten = require('../utils/flatten-array');

const marketClosures = require('../market-closures');

const formatDate = date => date.toLocaleDateString().split('/').join('-');

const TickerWatcher = require('./ticker-watcher');

const balanceReportManager = require('./balance-report-manager');
const settings = require('../settings');

const stratManager = {
    Robinhood: null,
    io: null,
    picks: [],
    tickersOfInterest: [],
    curDate: null,
    predictionModels: {},
    pmPerfs: [],
    hasInit: false,
    tickerWatcher: null, // TickerWatcher instance

    async init({
        io,
        dateOverride
    } = {}) {
        if (this.hasInit) return;
        this.Robinhood = global.Robinhood;
        this.io = io;
        this.tickerWatcher = new TickerWatcher({
            name: 'stratManager',
            Robinhood: this.Robinhood,
            handler: relatedPrices => {
                this.sendToAll('server:pm-perfs', this.calcPmPerfs());;
                this.sendToAll('server:related-prices', relatedPrices);
            }
        });

        // init picks?
        console.log('init refresh')
        try {
            await this.refreshPastData();
        } catch (e) {
            console.log('error refreshing past', e);
        }
        console.log('init picks')
        await this.initPicksAndPMs(dateOverride);
        console.log('get prices');
        await this.tickerWatcher.start();

        new CronJob(`40 7 * * 1-5`, () => this.newDay(), null, true);

        this.hasInit = true;

        console.log('about to init balance report')
        console.log("Global Robinhood")
        console.log(global.Robinhood)
        await balanceReportManager.init(global.Robinhood, report => {
            this.sendToAll('server:balance-report', {
                report
            });
        });

        console.log('initd strat manager');
    },
    async getWelcomeData() {
        return {
            curDate: this.curDate,
            picks: this.picks,
            relatedPrices: this.tickerWatcher.relatedPrices,
            pastData: this.pastData,
            predictionModels: this.predictionModels,
            settings,
            cronString: regCronIncAfterSixThirty.toString(),
            balanceReports: balanceReportManager.getAllBalanceReports(),
            pmPerfs: this.pmPerfs,
            positions: await cachedPositions(Robinhood)
        };
    },
    newPick(data) {
        this.tickerWatcher.addTickers(
            data.withPrices.map(o => o.ticker)
        );
        this.picks.push(data);
        this.sendToAll('server:picks-data', data);
    },
    getAllPicks() {
        return this.picks;
    },
    sendToAll(eventName, data) {
        this.io && this.io.emit(eventName, data);
    },
    async newDay() {
        console.log('NEW DAY')
        await this.tickerWatcher.lookupRelatedPrices();
        try {
            await this.sendPMReport();
        } catch (e) {
            console.log('error sending report', e);
        }
        await this.refreshPastData();
        this.picks = [];
        this.tickerWatcher.clearTickers();
        await this.initPicksAndPMs();
        await this.tickerWatcher.lookupRelatedPrices();
        this.sendToAll('server:welcome', await this.getWelcomeData());
    },
    async determineCurrentDay() {
        // calc current date
        const now = new Date();
        const compareDate = new Date();
        compareDate.setHours(7);
        compareDate.setMinutes(40);
        if (compareDate - now > 0) {
            now.setDate(now.getDate() - 1);
        }
        const day = now.getDay();
        const isWeekday = day >= 1 && day <= 5;
        let dateStr = formatDate(now);

        console.log({
            day,
            isWeekday,
            dateStr
        });

        if (!isWeekday || marketClosures.includes(dateStr)) {
            // from most recent day (weekend will get friday)
            let pms = await fs.readdir('./json/prediction-models');
            let sortedFiles = pms
                .map(f => f.split('.')[0])
                .sort((a, b) => new Date(b) - new Date(a));
            console.log(sortedFiles[0], '0')
            dateStr = sortedFiles[0];
        }
        return dateStr;
    },
    async initPicksAndPMs(dateOverride) {
        const dateStr = dateOverride || await this.determineCurrentDay();
        const hasPicksData = (await Pick.countDocuments({
            date: dateStr
        })) > 0;
        console.log('hasPicksData', hasPicksData);
        if (hasPicksData) {
            await this.initPicks(dateStr);
        }
        this.curDate = dateStr;
        console.log('cur date now', this.curDate);
        await this.refreshPredictionModels();
    },
    async initPicks(dateStr) {
        console.log('init picks', dateStr)
        const dbPicks = await Pick.find({
            date: dateStr
        }).lean();
        console.log('dbPicks', dbPicks);
        const picks = dbPicks.map(pick => ({
            stratMin: `${pick.strategyName}-${pick.min}`,
            withPrices: pick.picks
        }));

        console.log('numPicks', picks.length);

        console.log('mostRecentDay', dateStr);
        this.curDate = dateStr;

        const tickersOfInterest = flatten(
            picks.map(pick =>
                pick.withPrices.map(({
                    ticker
                }) => ticker)
            )
        );

        const uniqTickers = [...new Set(tickersOfInterest)];

        console.log('numUniqTickersOfInterest', uniqTickers.length)

        this.tickerWatcher.clearTickers();
        this.tickerWatcher.addTickers(uniqTickers);

        this.picks = picks;


    },
    calcPmPerfs() {
        const {
            relatedPrices
        } = this.tickerWatcher;
        console.log('calc pm perfs')
        const pmPerfs = Object.entries(this.predictionModels).map(entry => {
                const [stratName, trends] = entry;

                const handlePick = pick => {
                    const {
                        withPrices
                    } = pick;
                    if (typeof withPrices[0] === 'string') {
                        console.log(`typeof withPrices[0] === 'string'`, {
                            withPrices
                        });
                        return;
                    }
                    const withTrend = withPrices.map(stratObj => {
                        const relPrices = relatedPrices[stratObj.ticker];
                        if (!relPrices) {
                            console.log('OH NO DAWG', stratObj.ticker, stratObj);
                            return {};
                        }

                        const {
                            lastTradePrice,
                            afterHoursPrice
                        } = relPrices;
                        const nowPrice = lastTradePrice;
                        return {
                            ticker: stratObj.ticker,
                            thenPrice: stratObj.price,
                            nowPrice,
                            trend: getTrend(nowPrice, stratObj.price)
                        };
                    });
                    return withTrend;
                };

                let foundStrategies = trends
                    .reduce((acc, stratMin) => {
                        const foundStrategies = this.picks.filter(pick => pick.stratMin === stratMin);
                        if (!foundStrategies || !foundStrategies.length) return acc;
                        const withTrends = foundStrategies.map(handlePick);
                        const analyzed = withTrends.map(withTrend => ({
                            avgTrend: avgArray(withTrend.map(obj => obj.trend)),
                            stratMin,
                            tickers: withTrend.map(obj => obj.ticker)
                        }));
                        return [
                            ...acc,
                            ...analyzed
                        ];
                    }, []);

                foundStrategies = foundStrategies.filter(Boolean);

                const weightedTrend = avgArray(foundStrategies.map(obj => obj.avgTrend));
                return {
                    pmName: stratName,
                    weightedTrend,
                    // avgTrend: weightedTrend
                    avgTrend: stratName.includes('forPurchase') ? (() => {
                        let copy = [...foundStrategies];
                        const withoutDuplicates = [];
                        foundStrategies.forEach((stratObj, i) => {
                            if (copy.findIndex(s => JSON.stringify(s) === JSON.stringify(stratObj)) === i) {
                                withoutDuplicates.push(stratObj)
                            }
                        });
                        return avgArray(withoutDuplicates.map(obj => obj.avgTrend));
                    })() : weightedTrend
                };
            })
            .filter(t => !!t.avgTrend)
            .sort((a, b) => Number(b.avgTrend) - Number(a.avgTrend));


        console.log('done calcing pm perfs')
        this.pmPerfs = pmPerfs;
        return pmPerfs;

    },
    async sendPMReport() {
        console.log('sending pm report');
        const pmPerfs = this.calcPmPerfs();
        const emailFormatted = pmPerfs
            .map(pm => `${pm.avgTrend.toFixed(2)}% ${pm.pmName}`)
            .join('\n');
        await sendEmail(`Smebvesting: 24hr report for ${this.curDate}`, emailFormatted);
        await jsonMgr.save(`./json/pm-perfs/${this.curDate}.json`, pmPerfs);
        console.log('sent and saved pm report');
    },
    async createAndSaveNewPredictionModels(todayPMpath) {
        console.log('creating new prediction models');
        const newPMs = await createPredictionModels(this.Robinhood);
        console.log('saving to', todayPMpath);
        await jsonMgr.save(todayPMpath, newPMs);
        return newPMs;
    },
    async refreshPredictionModels() {
        console.log('refreshing prediction models');
        // set predictionmodels
        const todayPMpath = `./json/prediction-models/${this.curDate}.json`;
        try {
            var foundDayPMs = await jsonMgr.get(todayPMpath);
        } catch (e) {}
        this.predictionModels = foundDayPMs ? foundDayPMs : await this.createAndSaveNewPredictionModels(todayPMpath);
    },
    async refreshPastData() {
        console.log('refreshing past data');
        const stratPerfData = await stratPerfOverall(this.Robinhood, false, 5);
        await this.setPastData(stratPerfData);
    },
    async setPastData(stratPerfData) {
        const stratPerfObj = {};
        stratPerfData.sortedByAvgTrend.forEach(({
            name,
            avgTrend,
            count,
            percUp
        }) => {
            stratPerfObj[name] = {
                avgTrend,
                percUp,
                count
            };
        });
        this.pastData = {
            fiveDay: stratPerfObj
        };
    }
};

module.exports = stratManager;
