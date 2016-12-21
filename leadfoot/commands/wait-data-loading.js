import _ from 'lodash';
import pollUntil from 'leadfoot/helpers/pollUntil';

module.exports = function waitDataLoading(options) {
  if (typeof options === 'number') {
    options = {
      timeout: options
    };
  }
  options = _.merge({
    timeout: this.implicitWait,
    loadingIndicator: this.loadingIndicator
  }, options);
  return this.then(pollUntil(function(options) {
    if (options.loadingIndicator &&
      document.querySelector(options.loadingIndicator)) {
      return;
    }
    if (options.readyIndicator &&
      !document.querySelector(options.readyIndicator)) {
      return;
    }
    return true;
  }, [options], options.timeout));
};
