// looks back at all the picks made today
// finds the stocks that were recommended the most number of times

const fs = require('mz/fs');
const recordPicks = require('../app-actions/record-picks');
const jsonMgr = require('../utils/json-mgr');
const {
    uniqifyArray
} = require('../utils/uniqify-stuff');


const mostPicked = {
    name: 'most-picked',
    fn: async (Robinhood, min) => {

        let strategies = await fs.readdir('./json/picks-data');

        let sortedFolders = strategies.sort((a, b) => {
            return new Date(b) - new Date(a);
        });

        const recentDay = sortedFolders[0];

        let files = await fs.readdir(`./json/picks-data/${recentDay}`);
        console.log(recentDay, files);

        let tickerPicks = {};

        // load data from picks-data and keep track of tickers to lookup
        for (let file of files) {
            const strategyName = file.split('.')[0];
            const obj = await jsonMgr.get(`./json/picks-data/${recentDay}/${file}`);
            Object.keys(obj).forEach(key => {

                const picks = obj[key];
                picks.forEach(({
                    ticker
                }) => {
                    tickerPicks[ticker] = (tickerPicks[ticker] || []).concat(`${file.split('.')[0]}-${key}`);
                });

            });
        }

        // filter all the current strategies and only allow one strategy per minute runtime (dont include variations)
        // but dont include cheapest picks
        Object.keys(tickerPicks)
            .forEach(ticker => {
                tickerPicks[ticker] = tickerPicks[ticker]
                    .reduce((acc, strategy) => {
                        const min = strategy.split('-').pop();
                        if (
                            !acc.some(strat => strat.endsWith(`-${min}`) && strat.startsWith(strategy.substring(0, 5))) &&
                            !['cheapest-picks', 'most-picked'].some(strat => strategy.includes(strat))
                        ) {
                            acc.push(strategy);
                        }
                        return acc;
                    }, []);
            });

        console.log(JSON.stringify(tickerPicks, null, 2));
        console.log('-----------')

        const uniqPerms = [0.1, 0.2, 0.4, 0.5, 0.6, 0.8, 1];

        const response = uniqPerms
            .map(perm => {
                const tPicks = {
                    ...tickerPicks
                };
                const sorted = Object.keys(tPicks)
                    .map(ticker => {
                        tPicks[ticker] = uniqifyArray(tPicks[ticker], perm);
                        return ticker;
                    })
                    .sort((a, b) => {
                        return tPicks[b].length - tPicks[a].length;
                    });
                const count = tPicks[sorted[0]].length;
                console.log('COUNT', count);
                const picks = sorted.filter(picks => tPicks[picks].length === count);
                console.log(count, picks);
                return {
                    perm,
                    picks
                };
            })
            .reduce((acc, {
                perm,
                picks
            }) => ({
                ...acc,
                [`uniq${perm*10}`]: picks
            }), {});

        await recordPicks(Robinhood, 'most-picked', min, response);
    }
};

module.exports = mostPicked;
