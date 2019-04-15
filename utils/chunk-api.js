const mapLimit = require('promise-map-limit');
const moment = require('moment');

const splitIntoChunks = (array, size) => {
    const cloned = array.slice();
    var splitUp = [];
    while (cloned.length > 0)
        splitUp.push(cloned.splice(0, size));
    return splitUp;
};

function flatten(array) {
    return array.reduce((r, e) => Array.isArray(e) ? r = r.concat(flatten(e)) : r.push(e) && r, [])
}


module.exports = async (tickers, apiFn, num) => {
    const chunks = splitIntoChunks(tickers, num);
    let i = 0;
    let nestedArray = await mapLimit(chunks, 3, collection => {
        console.log(`${moment(new Date).format("LLL")} Chunks: `, ++i, '/', chunks.length);
        return apiFn(collection.join(','))
    });
    return flatten(nestedArray);
};
