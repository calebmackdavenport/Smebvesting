const addFundamentals = require('../app-actions/add-fundamentals');
module.exports = async (rh, ticker) => {

    let fundamentals;
    try {
        fundamentals = (await addFundamentals(rh, [{
            ticker
        }]))[0].fundamentals;
    } catch (e) {}
    const {
        volume,
        average_volume
    } = fundamentals || {};
    const highVol = volume > 1000000 || volume > average_volume * 3.5;
    const volumeKey = highVol ? 'highVol' : '';

    str({
        volume,
        average_volume,
        highVol,
        volumeKey
    })
}