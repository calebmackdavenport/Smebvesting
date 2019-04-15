const perms = [
    ['only-up'],
    ['', 'sp500'],
    ["", "onjn1to1", "onjn1to1AndTSOn1to1", "onj1to4AndTSOn5ton1", "onjn6ton1AndTSO1to3", "yesterdayDown", 'yesterdayDown10to3'],
    [
        365,
        100,
        90,
        60,
        30,
        20,
        15,
        10,
        7,
        5,
    ],
    [
        'percUp',
        'lightTrendScore',
        'heavyTrendScore',
        'inverseLightTrendScore',
        'inverseHeavyTrendScore',
        'periodTrendVolatilityScore'
    ],
    [
        '',
        'volatilityPick',
        'periodTrendVolatilityPick'
    ],
    [4, 95, 180, 250, 345],
];

const flatten = arr => [].concat(...arr);
module.exports = () => {

    let collection = [null];
    perms.forEach(perm => {
        collection = flatten(
            collection.map(curVar => {
                str({
                    curVar,
                    perm
                })
                return perm.map(
                    str => [
                        curVar,
                        str
                    ].filter(Boolean).join('-')
                );
            })
        );
        log(
            collection
        )
    });

    log(
        perms
    )

    return collection
}
