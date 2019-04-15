const Alpaca = require('@alpacahq/alpaca-trade-api');
const { alpacacreds } = require('../config');
const alpaca = new Alpaca(alpacacreds);

const client = alpaca.websocket
client.onConnect(function() {
  console.log("Connected")
  client.subscribe(['trade_updates', 'account_updates'])
})
client.onDisconnect(() => {
  console.log("Disconnected")
})
client.onStateChange(newState => {
  console.log(`State changed to ${newState}`)
})
client.onOrderUpdate(data => {
  console.log(`Order updates: ${JSON.stringify(data)}`)
})
client.onAccountUpdate(data => {
  console.log(`Account updates: ${JSON.stringify(data)}`)
})
client.onStockTrades(function(subject, data) {
  console.log(`Stock trades: ${subject}, ${data}`)
})
client.onStockQuotes(function(subject, data) {
  console.log(`Stock quotes: ${subject}, ${data}`)
})
client.onStockAggSec(function(subject, data) {
  console.log(`Stock agg sec: ${subject}, ${data}`)
})
client.onStockAggMin(function(subject, data) {
  console.log(`Stock agg min: ${subject}, ${data}`)
})
client.connect();

module.exports = {
    alpaca,
    client
};