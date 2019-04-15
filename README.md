# Smebvesting
#### Based on the Robinhood API. Makes stock recommendations that will go up or down in the next few days. Automatically invests with Alpaca's trading API.
 
 _I do not promise you rags to riches. Invest wisely._  
 _Built to run on a Raspberry Pi 3b+_  
  
### To get started
- [Robinhood](https://robinhood.com) account
- [Node](https://nodejs.org/en/download/) _(v10+)_
- [MongoDB](https://www.mongodb.com/download-center/community) _(optional, v2.6+)_
- [Alpaca](https://alpaca.markets/) account _(optional)_
- Gmail account _(optional)_

### What's the strategy?
Buy low, sell high. Always easier said than done.  
  
While it relies heavily on EMA Crossovers to place buy orders, if that's all it relied on, it would buy on too many short term false breakouts and consistently lose. By integrating multiple strategies, such as jump-downs and low-floats, as well as primarily buying when stocks have suffered a recent >15% loss, it has seen success in the stocks valued below $20. They're more likely to have suffered a temporary loss, than a substantial loss of investment. These same strageies are often not applicable to stocks of higher evaluation, like FAANG.

### How does this thing work?
This app uses Robinhood for its primary source of data.  
It cross compares a few additional sources such as _StockInvest_, _Finviz_, & _Yahoo Finance_ for additional information.  
It makes automated purchases with Alpaca. Alpaca provides a "paper" key to test their services with no real money in the game.  
If you decide you want to invest, I recommend using Alpaca's automated service and replacing your paper keys with live trading keys.  
- If you configure MongoDB, you will get an accumulation of balanceReports and picks that have crossed strategy thresholds.  
These reports will allow you to monitor and manually invest if you like what you see or some are warnings to sell now.  
- If you configure your email, you will get up to date emails of the picks so you can make a move quickly.
- If you configure your Alpaca account, you will get automated investing when the stocks trigger the automated strategy thresholds. This will use a percentage of available funds to place a buy order.  

### Lets get this thing running  
#### From the root directory
`npm install`  
`npm audit fix` (optional)

#### Get MongoDB running (optional)
I have MongoDB Compass Community so I can visually see the database.  
I recommend using the default settings if you're new, and let it host itself on localhost:27017.  
The models folder controls where and how data is inserted into your database.  
The Mongo connection string is set in config.js as referenced below.

#### Gmail settings (optional)
You may want to create an inbox rule that redirects emails with _Smebvesting_ into a separate folder.  
A purpose of this application is to alert you to investment suggestions.  
If you have everything set up correctly, it will send about 5-10 emails a day.  

#### Create your configuration file  (required)
Create a config.js file in your root directory that looks like the follow. Populate with your own values.  
```
module.exports = {
    credentials: {
      username: 'robinhood_username',
      password: 'robinhood_password'
    },
    robinhoodID: 'robinhood_8character_id',
    gmail: {
      credentials: {
        user: 'gmail_email_address',
        pass: 'gmail_password'
      }
    },
    alpacacreds: {
      keyId: "alpaca_key",
      secretKey: "alpaca_secret_key",
      paper: true
    },
    stockinvestapi: {
      top100: 'https://stockinvest.us/list/buy/top100',
      undervalued: 'https://stockinvest.us/list/undervalued',
      penny: 'https://stockinvest.us/list/pennystocks'
    },
    mongoConnectionString: "mongodb://localhost:27017/admin",
    emails: ["whatever_email_you_want_receiving_notifications", "and_any_others"]
};
```

#### You should now be able to run the app
`npm start`