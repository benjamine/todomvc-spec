'use strict';
import _ from 'lodash';

let defaultOptions = {
  timeout: 30000
};

function waitUntil(fn, waitOptions) {
  if (!fn) {
    throw new Error('no command to wait for were specified');
  }
  let options = _.merge(_.cloneDeep(defaultOptions), waitOptions || {});
  let startTime = new Date().getTime();
  let checkCommand = () =>
    fn.apply(this).then(result => {
      if (options.result !== undefined) {
        if (options.result instanceof RegExp) {
          if (!options.result.test(result)) {
            throw new Error(`expected result ${result} to match ${options.result}`);
          }
        } else if (typeof options.result === 'function') {
          if (!options.result(result)) {
            throw new Error(`expected result ${result} is not the expected`);
          }
        } else {
          if (options.result === result) {
            throw new Error(`expected result ${result} to be ${options.result}`);
          }
        }
      }
      if (options.not) {
        let err = new Error('command didn\'t fail');
        err.commandShouldHaveFailed = true;
        throw err;
      }
    }).catch(err => {
      if (err && options.not && !err.commandShouldHaveFailed) {
        return;
      }
      if (new Date().getTime() - startTime >= options.timeout) {
        throw err;
      }
      return new Promise(resolve => {
        setTimeout(resolve, 200);
      }).then(checkCommand);
    });

  /* jshint validthis: true */
  return this.then(checkCommand);
}

module.exports = waitUntil;
