const { alpaca } = require('.');

module.exports = async () => {
    const orders = await alpaca.getOrders({
        status: 'open'
    });
    str({ orders })
    for (let order of orders) {
        log(await alpaca.cancelOrder(order.id));
    }
};
