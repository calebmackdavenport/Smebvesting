const mongoose = require('mongoose');
const {
    mongoConnectionString
} = require('../config');

console.log({
    mongoConnectionString
})
mongoose.connect(mongoConnectionString);

const StratPerf = require('../models/StratPerf');

const Cat = mongoose.model('Cat', {
    name: String
});

const kitty = new Cat({
    name: 'Zildjian'
});
kitty.save().then(() => console.log('meow'));

(async () => {
    console.log('cb', await StratPerf.getByDate('10-26-2018'));
})();