import chalk from 'chalk';
import repl from 'repl';

function replMode(world) {
  console.log(chalk.cyan('************************'));
  console.log(chalk.cyan('  starting REPL'));
  console.log(chalk.cyan('************************'));

  function customEval(cmd, context, filename, callback) {
    let async = /done\s*[()]/.test(cmd);
    try {
      let done = async ? function(err) {
        if (err) {
          console.log('ERROR:', err);
          callback();
          return;
        }
        callback.apply(this, arguments);
      } : null;
      let src = 'var done=arguments[0];with(this){return (' + cmd + ');}';
      /* eslint no-new-func: off */
      let result = (new Function(src)).call(context, done);
      if (async) {
        return;
      }
      callback(null, result);
    } catch (err) {
      console.log('ERROR:', err);
      callback(null, err);
    }
  }
  let replSession = repl.start({
    eval: customEval
  });
  let ctx = replSession.context;
  ctx.this = world;
  ctx.world = world;
  ctx.browser = world && world.browser;

  return new Promise(function(resolve) {
    replSession.on('exit', resolve);
  });
}

module.exports = replMode;
