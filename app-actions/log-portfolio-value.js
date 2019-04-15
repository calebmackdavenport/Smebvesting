// npm
const fs = require('mz/fs');

module.exports = async (Robinhood) => {
    
    let portfolioCache = {};
    const {
        robinhoodID
    } = require('../config');

    let response = await Robinhood.url(`https://api.robinhood.com/portfolios/historicals/${robinhoodID}/?span=year&interval=day`); //your 8 character robinhood identifier
    let {equity_historicals: hist} = response; 
    console.log(response, 'log port val');
    hist = hist.map(h => ({
        ...h,
        date: (() => {
            const d = new Date(h.begins_at);
            d.setDate(d.getDate() + 1);
            return d.toLocaleDateString().split('/').join('-');
        })(),
        close: Number(h.adjusted_close_equity)
    }));

    hist.forEach(h => {
        portfolioCache[h.date] = h.close;
    });

    try {
        await fs.writeFile('./portfolio-cache.json', JSON.stringify(portfolioCache, null, 2));
    } catch (e) {}

};
