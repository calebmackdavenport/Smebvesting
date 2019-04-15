const gmailSend = require('gmail-send');
const { gmail } = require('../config');

const send = gmailSend({
  user: gmail.user,
  pass: gmail.pass
});

module.exports = (subject, body, to = gmail.user) => new Promise((resolve, reject) => {
    console.log(`sending email...to ${to}...`);
    console.log('subject', subject, 'body', body);
    send({
        subject,
        text: body,
        to
    }, (err, res) => err ? reject(err) : resolve(res));
});
