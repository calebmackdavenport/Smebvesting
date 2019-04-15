# Smebvesting
#### Based on the Robinhood API. Makes stock recommendations that will go up or down in the next few days.  
 
 _I do not promise you rags to riches. Invest wisely._
  
  
### Some things you'll need to get started
- [Alpaca](https://alpaca.markets/) account
- [Robinhood](https://robinhood.com) account
- [MongoDB](https://www.mongodb.com/download-center/community) (v2.6+)
- [Node](https://nodejs.org/en/download/) (v10+)
- Gmail account

### How does this thing work?
This app uses Robinhood for its primary source of data.  
It cross compares a few additional sources such as _StockInvest_, _Finviz_, & _Yahoo Finance_ for additional information.  
It makes automated purchases with Alpaca. Alpaca provides a "paper" key to test their services with no real money in the game.  
If you decide you want to invest, I recommend using Alpaca's automated service and replacing your paper keys with live trading keys.

### What's the strategy?
Buy low, sell high. Easier said than done.  
While it relies heavily on EMA Crossovers to determine proper buying time, if that's all it relied on, it would buy on too many short term false breakouts and consistently lose. By integrating multiple strategies and primarily buying when stocks have suffered a recent >15% loss, it has seen success in the stocks valued below $20. They're more likely to have suffered a temporary loss, than a substantial loss of investment. These same strageies are often not applicable to stocks of higher evaluation, like FAANG.

### Lets get this thing running  
#### From the root directory
`npm install`  
`npm audit fix` (optional)

#### Get MongoDB running
I have MongoDB Compass Community so I can visually see the databases.  
I recommend using the default settings if you're new, and let it host itself on localhost:27017  
The models folder controls where and how data is inserted into your database.

#### Gmail settings
You may want to create an inbox rule that redirects emails with the _Robinsmeb_ into a separate folder.  
The purpose of this application is to alert you to investment suggestions.  
If you have everything set up correctly, it certainly will.  

#### Create your configuration file  
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