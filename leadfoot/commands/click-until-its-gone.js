function clickUntilItsGone(element) {
  if (!element) {
    element = this;
  }
  let maxRetries = 15;

  function ifVisibleClickAndRetry(retries) {
    return function() {
      return element.isDisplayed().then(function(displayed) {
        if (!displayed) {
          // not displayed = gone
          return;
        }
        console.log('element is still displayed, retrying');
        if (retries < 1) {
          throw new Error('clicked element but it doesn\'t dissapear as expected');
        }
        return element.click().sleep(1000).then(ifVisibleClickAndRetry(retries));
      }).catch(function(err) {
        if (/(stale|no longer attached)/i.test(err.message)) {
          // element is gone from the page
          return;
        }
        throw err;
      });
    };
  }
  return element.click().then(ifVisibleClickAndRetry(maxRetries));
}

clickUntilItsGone.usesElement = true;
module.exports = clickUntilItsGone;
