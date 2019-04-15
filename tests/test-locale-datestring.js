(() => {
    console.log(
        'today',
        (new Date()).toLocaleDateString().split('/').join('-')
    )
})();