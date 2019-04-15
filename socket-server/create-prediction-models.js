const manualPMs = require('../pms/manual');
const spms = require('../pms/spm');
const getMyRecs = require('../pms/my-recs');
const getTipTop = require('../pms/tip-top');
const topPerforming = require('../pms/top-performing');
const tenFives = require('../pms/ten-fives');

const settings = require('../settings');
const flatten = require('../utils/flatten-array');
const stratPerfOverall = require('../analysis/strategy-perf-overall');

module.exports = async (Robinhood, manualOnly = true) => {

    pastData = await (async () => {
        const stratPerfData = await stratPerfOverall(Robinhood, true, 4);
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
        return {
            fiveDay: stratPerfObj
        };
    })();

    const prependKeys = (obj, prefix) => Object.keys(obj).reduce((acc, val) => ({
        ...acc,
        [`${prefix}-${val}`]: obj[val]
    }), {});

    let strategies = {

        ...manualPMs,

        ...!manualOnly ? await (async () => {

            const myRecs = await getMyRecs(Robinhood);
            const fiftytwo = await spms(Robinhood);
            const eightDay = await spms(Robinhood, 8);
            const tp = await topPerforming(Robinhood);

            return {
                // myRecs
                ...prependKeys(myRecs, 'myRecs'),

                //8daySPMs
                ...prependKeys(eightDay, 'spm-8day'),

                //fiftytwodaySPMs
                ...prependKeys(fiftytwo, 'spm-52day'),

                //top-performers
                ...prependKeys(tp, 'top-performers'),

                ...prependKeys(
                    await tenFives(Robinhood),
                    'tenFives'
                ),

                ...await getTipTop(Robinhood)
            };
        })() : {}


    };

    console.log('done donezy');

    const flattenStrategiesWithPMs = array =>
        flatten(
            array.map(strat => {
                if (strat && strat.startsWith('[')) {
                    const pmStrats = strategies[strat.substring(1, strat.length - 1)];
                    if (!pmStrats) {
                        console.log('could not find pm', strat);
                    }
                    return pmStrats;
                }
                return strat;
            })
        );

    const forPurchase = flattenStrategiesWithPMs(settings.forPurchase);

    const forPurchaseVariations = (() => {
        const filterBy5DayPercUp = (perc, includeBlanks) => forPurchase
            .filter(strat => {
                const foundFiveDay = pastData.fiveDay[strat];
                return (includeBlanks && !foundFiveDay) ||
                    (foundFiveDay && foundFiveDay.percUp >= perc / 100);
            });
        return [
            25,
            50,
            75,
            80,
            100
        ].reduce((acc, perc) => ({
            [`forPurchase${perc}Perc5Day-notincludingblanks`]: filterBy5DayPercUp(perc),
            [`forPurchase${perc}Perc5Day-yesincludingblanks`]: filterBy5DayPercUp(perc, true),
            ...acc
        }), {});
    })();

    let forPurchasePMs = {
        forPurchase,
        ...forPurchaseVariations
    };

    // settings...

    // for purchase variations
    const {
        forPurchaseVariation
    } = settings;
    if (forPurchaseVariation) {
        console.log('FOR PURCHASE VARIATION FOUND', forPurchaseVariation);
        forPurchasePMs = {
            ...forPurchasePMs,
            originalForPurchase: forPurchasePMs.forPurchase,
            forPurchase: forPurchasePMs[`forPurchase${forPurchaseVariation}`]
        };
        console.log(`FOR PURCHASE WENT FROM ${forPurchasePMs.originalForPurchase.length} to ${forPurchasePMs.forPurchase.length} strategies`);
    }

    return {
        ...strategies,
        ...forPurchasePMs
    };
};