module.exports = {
    // important settings
    sellAllStocksOnNthDay: 10,
    purchaseAmt: 40,
    forPurchase: [
        '[smebtw]',
        '[smebhighvol]',
        '[smebemacrossovers]',
        '[smebsingletw]',
        '[smebsinglenewhighs]',
        '[smebsinglehighvol]',
        '[stockInvest]',
        '[stockInvest]',
    ],
    disableMultipliers: false,
    force: {
        sell: [],
        keep: [
            'ACIU',
            'UEPS',
            'MNGA'
        ]
    }
};
