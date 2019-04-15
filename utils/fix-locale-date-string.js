// we want month-day-year

const oldLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function() {
    const prevOutput = oldLocaleDateString.apply(this);
    const [year, month, day] = prevOutput.split('-');
    if (year.length !== 4) return prevOutput;
    return [month, day, year].join('-');
};

global.log = console.log;
global.str = obj => log(JSON.stringify(obj, null, 2));
global.mapLimit = require('promise-map-limit');
global.flatten = arr => [].concat(...arr);




const roundTo = numDec => num => Math.round(num * Math.pow(10, numDec)) / Math.pow(10, numDec);
const oneDec = roundTo(1);
const twoDec = roundTo(2);

global.twoDec = twoDec;