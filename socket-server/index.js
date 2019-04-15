'use strict';

const express = require('express');
const http = require('http');
const SocketIO = require('socket.io');
const compression = require('compression');
const stratManager = require('./strat-manager');
const path = require('path');
const DayReport = require('../models/DayReport');

const mapLimit = require('promise-map-limit');
const lookupMultiple = require('../utils/lookup-multiple');
const getFilesSortedByDate = require('../utils/get-files-sorted-by-date');
const jsonMgr = require('../utils/json-mgr');

let app = express();
let server = http.Server(app);
let io = new SocketIO(server);
let port = process.env.PORT || 3000;

app.use(compression({}));


const prependFolder = folder => path.join(__dirname, `../${folder}`);
app.use('/', express['static'](prependFolder('client/build')));
app.use('/user-strategies', express['static'](prependFolder('user-strategies/build')));

io.on('connection', async socket => {

    socket.emit('server:welcome', await stratManager.getWelcomeData());

    socket.on('get-current-prices', async tickers => {
        const response = await lookupMultiple(Robinhood, tickers, true);
        console.log('got current pricessss', response);
        socket.emit('server:current-prices', response);
    });

    socket.on('getRecentTrends', async (cb) => {
        const mostPopularFiles = (await getFilesSortedByDate('100-most-popular')).slice(-3);
        console.log({
            mostPopularFiles
        })
        const withJSON = await mapLimit(mostPopularFiles, 1, async file => ({
            file,
            json: await jsonMgr.get(`./json/100-most-popular/${file}.json`)
        }));
        console.log({
            withJSON
        })
        const obj = withJSON.reduce((acc, {
            file,
            json
        }) => ({
            ...acc,
            [file]: json
        }), {});

        for (let userStrat of withJSON) {
            socket.emit('server:user-strat', userStrat);
        }

        return cb(obj);
    });

    socket.on('getDayReports', async cb => {
        console.log('getting day reports');
        cb({
            dayReports: await DayReport.find()
        });
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('userDisconnect');
    });

});

server.listen(port, async () => {
    stratManager.init({
        io
    });
    console.log('[INFO] Listening on *:' + port);
});
