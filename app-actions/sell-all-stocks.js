const activeSell = require('./active-sell');
const mapLimit = require('promise-map-limit');

const sellAllStocks = async (Robinhood) => {
    const {
        results: allPositions
    } = await Robinhood.nonzero_positions();
    console.log('allpos', allPositions);

    const sellPosition = async pos => {
        const instrument = await Robinhood.url(pos.instrument);
        try {
            const response = await activeSell(
                Robinhood, {
                    ticker: instrument.symbol,
                    quantity: pos.quantity
                }
            );
            console.log('pos,', pos);
            console.log('ins', instrument);
            console.log('response', response);
            return response;
        } catch (e) {
            console.error('more err', e);
        }
    };

    for (let position of allPositions) {
        if (Math.random() > 0.5) {
            setTimeout(
                () => sellPosition(position),
                Math.random() * 1000 * 60 * 20
            );
        } else {
            await sellPosition(position);
        }
    }

};

module.exports = sellAllStocks;
