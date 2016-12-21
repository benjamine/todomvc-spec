'use strict';

import path from 'path';

class StackTracesPlugin {

  initialize() {
    let isMyStack = new RegExp(
      path.join(
        __dirname,
        '../..' // go up two dirs to get to repo root
      )
      .replace(/\//g, '\\/') +
      '\\/(?!node_modules)'
    );

    // filter the stack trace to only show code from this repo
    Error.prepareStackTrace = function(err, stack) {
      let output = [
        (err instanceof Error ? '' : 'ERROR: ') + err.toString()
      ];
      for (let i = 0; i < stack.length; i++) {
        let frame = stack[i].toString();
        if (i < 1 || (isMyStack.test(frame) && !/util\/promisify\.js/.test(frame))) {
          output.push('    at ' + frame);
        }
      }
      return output.join('\n');
    };
  }

}

export default new StackTracesPlugin();
