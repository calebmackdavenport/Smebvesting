const stratManager = require('../socket-server/strat-manager');

module.exports = async () => {
    await stratManager.init();
    console.log(
        JSON.stringify(
            stratManager.calcPmPerfs(),
            null,
            2
        ),
        'report',
    );
};