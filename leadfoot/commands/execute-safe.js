import chalk from 'chalk';

module.exports = function executeSafe(fn, executeArgs) {
  // execute wrapper that captures errors in browser to print nicer errors

  let fnString = fn.toString();
  fnString = typeof fn === 'function'
    ? fnString
    : `function(){\nreturn (${fnString});\n}`;
  let args = executeArgs || [];
  args.push(fnString);
  /* jshint evil: true */
  let safeFn = function safeExecuteFn() {
    let fn;
    try {
      /* eslint no-new-func: off */
      fn = (new Function(
        // support babel _typeof
        'var _typeof = function(obj){' +
          'return obj && obj.constructor === Symbol ? \'symbol\' : typeof obj;' +
        '};\n' +
        'return ' + arguments[arguments.length - 1]))();
      let args = Array.prototype.slice.call(arguments, 0, -1);
      return fn.apply(this, args);
    } catch (err) {
      return {
        isExecuteSafeErrorWrapper: true,
        message: err.message,
        error: err.stack || err.toString()
      };
    }
  };
  return this.execute(safeFn, args).then(function(result) {
    if (result && result.isExecuteSafeErrorWrapper) {
      // error captured by safe wrapper
      let message = ['remote execute failed: '];
      // try chrome-like stack trace format
      let evalLineMatch = /at eval [^\n]*:(\d+):(\d+)\) *$/m.exec(result.error);
      if (!evalLineMatch) {
        // try firefox-like stack trace format
        evalLineMatch = /Function:(\d+):(\d+) *$/m.exec(result.error);
      }
      if (evalLineMatch) {
        let errorLine = +evalLineMatch[1];
        message.push(result.message + ' (line ' +
          evalLineMatch[1] +
          ')\n' + chalk.red('**********************************') + '\n');
        message.push(fnString.split('\n').map(function(line, index) {
          if (index + 1 === errorLine) {
            return chalk.red(line.replace(/^ {0,3}/, '>>>'));
          }
          return line;
        }).join('\n'));
        message.push('\n' + chalk.red('**********************************') + '\n');
      }
      message.push(result.error + '\n    - (end of remote error stack) -');
      throw new Error(message.join(''));
    }
    return result;
  });
};
