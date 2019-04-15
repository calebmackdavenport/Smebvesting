const mapLimit = require('promise-map-limit');
const lookup = require('../utils/lookup');
const addBuyDataToPositions = require('../app-actions/add-buy-data-to-positions');
// const getAssociatedStrategies = require('./get-associated-strategies');

const getDetailedNonZero = async (Robinhood) => {
    const {
        results: allPositions
    } = await Robinhood.nonzero_positions();
    const formattedPositions = allPositions.map(pos => ({
        ...pos,
        average_buy_price: Number(pos.average_buy_price),
        quantity: Number(pos.quantity)
    }));
    const atLeastOneShare = formattedPositions.filter(pos => pos.quantity);
    console.log('getting detailed non zero');
    let formattedWithLookup = await mapLimit(atLeastOneShare, 1, async pos => {
        const instrument = await Robinhood.url(pos.instrument);
        console.log('looking up instrument', instrument.symbol);
        try {
            const lookupObj = await lookup(Robinhood, instrument.symbol);
            return {
                ...pos,
                ticker: instrument.symbol,
                ...lookupObj,
            };
        } catch (e) {
            console.log('unable to lookup', instrument.symbol);
        }
    });

    formattedWithLookup = formattedWithLookup.filter(Boolean);

    const withBuyData = await addBuyDataToPositions(formattedWithLookup);

    const withEquity = withBuyData.map(pos => ({
        ...pos,
        equity: +(pos.currentPrice * pos.quantity).toFixed(2)
    })).sort((a, b) => b.equity - a.equity);

    const totalInvested = withEquity.reduce((acc, pos) => acc + pos.equity, 0);
    const withPercTotal = withEquity.map(pos => ({
        ...pos,
        percTotal: +(pos.equity / totalInvested * 100).toFixed(2)
    }));

    console.log('non-zero total', withTicks);
    return withPercTotal;
};

module.exports = getDetailedNonZero;