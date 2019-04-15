const jsonMgr = require('../../utils/json-mgr');
const getFilesSortedByDate = require('../../utils/get-files-sorted-by-date');

module.exports = async json => {
    const mostRecentDay = (await getFilesSortedByDate('prediction-models'))[0];
    jsonMgr.save(`./json/strat-perf-multiples/${mostRecentDay}.json`, json);
};
