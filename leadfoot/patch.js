import _s from 'underscore.string';
import bulkRequire from 'bulk-require';
import path from 'path';
import LeadfootCommand from 'leadfoot/Command';
let libPatched = false;

module.exports = function(config) {
  if (libPatched) {
    return;
  }
  libPatched = true;

  // config values

  LeadfootCommand.prototype.implicitWait = config.implicitWait || 5000;
  LeadfootCommand.prototype.loadingIndicator = config.loadingIndicator || '.loading';

  // custom commands

  let commands = bulkRequire(path.join(__dirname, 'commands'), ['*.js']);
  for (let commandName in commands) {
    let camelName = _s.camelize(commandName);
    let command = commands[commandName];
    LeadfootCommand.prototype[camelName] = command;
    LeadfootCommand.addSessionMethod(LeadfootCommand.prototype, camelName, command);
  }

  // driver-specific fixes

  let webDriverOptions = config.driver;
  let browserName = webDriverOptions.desiredCapabilities.browserName;

  if (/chrome/i.test(browserName)) {
    // ChromeDriver sucks at clicking, so click using js
    require('./patches/click-using-js')(config);
  }
};
