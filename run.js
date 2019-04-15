const login = require('./rh-actions/login');
const getTrendBreakdowns = require('./app-actions/get-trend-breakdowns');

const mongoose = require('mongoose');
const {
    mongoConnectionString
} = require('./config');

mongoose.connect(mongoConnectionString, {
    useNewUrlParser: true
});

require('./utils/fix-locale-date-string');

(async () => {
    console.log(process.argv, 'ps');
    let Robinhood = await login();
    global.Robinhood = Robinhood;
    const argPath = process.argv[2];
    let relatedFile = require(`./${argPath}`);

    let callArgs = [Robinhood];
    const restArgs = process.argv.slice(3)
        .map(arg => arg === 'true' ? true : arg)
        .map(arg => arg === 'false' ? false : arg);

    if (argPath.includes('modules/')) {
        const {
            trendFilter,
            trendFilterKey
        } = relatedFile;
        if (trendFilter && trendFilterKey !== null) {
            const trendBreakdowns = await getTrendBreakdowns(Robinhood);
            let trendKeyArg = 'under5';
            if (Object.keys(trendBreakdowns).includes(restArgs[0])) {
                trendKeyArg = restArgs.shift();
                log('supplied', trendKeyArg);
            }
            log({
                trendKeyArg
            })
            const trend = trendBreakdowns[trendKeyArg];
            callArgs.push(trend);
        } else {
            callArgs.push(25);
        }
    }

    const fnToRun = relatedFile.trendFilter || relatedFile.fn || relatedFile.init || relatedFile.default || relatedFile;
    const response = await fnToRun(...callArgs, ...restArgs);
    console.log('response');
    console.log(JSON.stringify(response, null, 2));

    mongoose.connection.close();
})();
