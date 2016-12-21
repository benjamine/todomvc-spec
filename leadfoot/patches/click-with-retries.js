/*
  patches .click() to retry on some common errors where implicit wait fails

  ChromeDriver doesn't use implicit wait for elements to become clickable/visible
    selenium issue: https://code.google.com/p/selenium/issues/detail?id=711
*/

import leadfootElement from 'leadfoot/Element';
import promiseRetry from 'promise-retry';

module.exports = function() {
  let originalClick = leadfootElement.prototype.click;
  leadfootElement.prototype.click = function() {
    let args = Array.from(arguments);
    return promiseRetry(retry =>
      originalClick.apply(this, args).catch(err => {
        if (/not (visible|clickable)/i.test(err.message)) {
          return retry(err);
        }
        throw err;
      })
    );
  };
};
