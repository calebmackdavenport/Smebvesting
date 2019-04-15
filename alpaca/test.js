const { alpaca } = require('.');

module.exports = async _ => {
    const account = await alpaca.getAccount();
    console.log('Current Account:', account);

    // await alpaca.cancelOrder('orderid');

    log(
      await alpaca.getOrders()
    )

    // put in your test order here
    // const order = await alpaca.createOrder({
    //     symbol: 'BPMX', // any valid ticker symbol
    //     qty: 1,
    //     side: 'buy',
    //     type: 'market',
    //     time_in_force: 'day',
    //     client_order_id: '' // optional
    // });

    // log(order)
};