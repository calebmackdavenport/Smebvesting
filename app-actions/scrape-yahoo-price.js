const puppeteer = require('puppeteer');

let browser;
module.exports = async ticker => {
    try {
        browser = browser || await puppeteer.launch();
        const page = await browser.newPage();

        await page.goto(`https://finance.yahoo.com/quote/${ticker}`);

        const sel = '#quote-header-info > div:nth-child(3) > div:nth-child(1) > div > span:nth-child(1)';
        const returnVal = await page.evaluate((sel) => document.querySelector(sel).textContent, sel);
        console.log('current price', ticker, returnVal);
        return Number(returnVal);
    } catch (e) {
        return null;
    }
};
