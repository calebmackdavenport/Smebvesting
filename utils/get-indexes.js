const request = require('request-promise');
const cheerio = require('cheerio');
const mapLimit = require('promise-map-limit');

const indexes = {
    sp500: 'https://finance.yahoo.com/quote/%5EGSPC?p=^GSPC',
    nasdaq: 'https://finance.yahoo.com/quote/%5EIXIC?p=^IXIC',
    russell2000: 'https://finance.yahoo.com/quote/%5ERUT?p=^RUT'
};

const getIndexPrice = async index => {
    const url = indexes[index];
    console.log({ index, url })
    const res = await request(url);
    const $ = cheerio.load(res);
    const text = $('#quote-header-info > div:nth-child(3) > div > div span').first().text();
    return {
        index,
        price: Number(text.replace(/\,/g,''))
    };
};

let lastPrices = {};

module.exports = async () => {
    const asArray = await mapLimit(Object.keys(indexes), 1, getIndexPrice);
    const response = asArray.reduce((acc, { index, price }) => ({
        ...acc,
        [index]: price ? price : (() => {
            console.log('retreiving from lastPrices because !price', index);
            return lastPrices[index];
        })()
    }), {});
    lastPrices = response;
    return response;
};