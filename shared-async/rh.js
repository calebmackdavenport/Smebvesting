let rh = require('robinhood');

const {
    credentials
} = require('../config');
const retryPromise = require('../utils/retry-promise');

let hasInitd = false;

const Robinhood = () => {
    return rh;
};

const login = () => new Promise(resolve => {
    rh(credentials, () => resolve(rh));
});

const cbToPromises = () => {
    Object.keys(rh).forEach(key => {
        console.log('key', key);
        const origFn = rh[key];
        rh[key] = retryPromise((...callArgs) => {
            return new Promise(async (resolve, reject) => {
                if (!hasInitd) await Robinhood.init();
                origFn.apply(null, [...callArgs, (error, response, body) => {
                    return (error || !body) ? reject(error) : resolve(body);
                }]);
            });
        });
    });
};

Robinhood.init = async () => {
    rh = await login();
    cbToPromises();
    hasInitd = true;
    return rh;
};

module.exports = Robinhood;
