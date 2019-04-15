const cacheThis = require('./cache-this');
const getNonZero = require('../app-actions/detailed-non-zero');

module.exports = cacheThis(
    getNonZero,
    // 20 min default
);