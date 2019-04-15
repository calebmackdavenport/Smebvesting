const highVolumePicks = [
    'high-volume-sp500-tscPosLt3-absVolume-5',
    'high-volume-sp500-tscPosLt3-volumeTo2Week-5',
    'high-volume-sp500-tscPosLt3-twoWeekToAvg-5',
    'high-volume-sp500-tscPosLt3-volumeToAvg-5',
    'high-volume-sp500-tscLt3-absVolume-5',
    'high-volume-sp500-tscLt3-volumeTo2Week-5',
    'high-volume-sp500-tscLt3-twoWeekToAvg-5',
    'high-volume-sp500-tscLt3-volumeToAvg-5',
    'high-volume-tscPosLt3-absVolume-5',
    'high-volume-tscPosLt3-volumeTo2Week-5',
    'high-volume-tscPosLt3-twoWeekToAvg-5',
    'high-volume-tscPosLt3-volumeToAvg-5',
    'high-volume-tscLt3-absVolume-5',
    'high-volume-tscLt3-volumeTo2Week-5',
    'high-volume-tscLt3-twoWeekToAvg-5',
    'high-volume-tscLt3-volumeToAvg-5',
    'high-volume-tscPosLt3-absVolume-60',
    'high-volume-tscPosLt3-volumeTo2Week-60',
    'high-volume-tscPosLt3-twoWeekToAvg-60',
    'high-volume-tscPosLt3-volumeToAvg-60',
    'high-volume-tscLt3-absVolume-60',
    'high-volume-tscLt3-volumeTo2Week-60',
    'high-volume-tscLt3-twoWeekToAvg-60',
    'high-volume-tscLt3-volumeToAvg-60',
];

const newHighPicks = [
    'new-highs-highestThirtyFiveTo90Ratio-lowestfiveTo35ratio-0',
    'new-highs-overall-lowestfiveTo35ratio-0',
    'new-highs-lowestThirtyFiveTo90RatioSma180Up-highestfiveTo35ratio-0',
    'new-highs-highestThirtyFiveTo90Ratio-lowestfiveTo35ratio-90',
    'new-highs-overall-lowestfiveTo35ratio-90',
    'new-highs-lowestThirtyFiveTo90RatioSma180Up-highestfiveTo35ratio-90',
    'new-highs-top100RH-overall-lowestfiveTo35ratio-0',
    'new-highs-top100RH-overall-lowestfiveTo35ratio-90',
    'new-highs-top100RH-highestThirtyFiveTo90RatioSma180Up-lowestfiveTo35ratio-0',
    'new-highs-top100RH-highestThirtyFiveTo90RatioSma180Up-lowestfiveTo35ratio-90',
];

const stockInvest = [
    "stock-invest-top100-4",
    "stock-invest-top100-104",
    "stock-invest-top100-200",
    "stock-invest-undervalued-4",
    "stock-invest-undervalued-104",
    "stock-invest-undervalued-200",
    "stock-invest-penny-4",
    "stock-invest-penny-104",
    "stock-invest-penny-200"
];

const feelingGoodInTheNeighborhood = [
    ...highVolumePicks,
    ...newHighPicks,
];
module.exports = {
    ...require('./ticker-watchers'),
    
    ...require('./ema-crossovers'),

    ...require('./smeb'),

    onlyUp: require('./only-up'),
    feelingGoodInTheNeighborhood,
    highVolumePicks,
    newHighPicks,
    stockInvest,
};