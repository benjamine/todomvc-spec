import chalk from 'chalk';
import selenium from 'selenium-standalone';
import tcpPortUsed from 'tcp-port-used';

function StandaloneSelenium() {}

function log() {
  if (process.env.SILENT) {
    return;
  }
  return console.log.apply(console, arguments);
}

StandaloneSelenium.prototype.start = function(startOptions) {
  if (this.startPromise) {
    return this.startPromise;
  }

  let self = this;
  let options = {
    // spawn options for the selenium server (see child_process.spawn)
    spawnOptions: {
      stdio: process.env.SELENIUMDEBUG ? 'inherit' : 'pipe'
    },
    // options to pass to `java -jar selenium-server-standalone-X.XX.X.jar`
    seleniumArgs: [
      '-browserSideLog',
      '-debug'
      // '-debug'
    ]
  };

  this.startPromise = new Promise(function(resolve, reject) {
    let startTimeout = setTimeout(function() {
      console.log('selenium start timeout');
      if (self.server) {
        self.server.kill();
        self.server = null;
      }
      console.log('====== SERVER OUTPUT ======');
      console.log(self.serverOutput || '(no output)');
      console.log('======    END        ======');
      reject(new Error('timeout waiting for selenium server to be ready'));
    }, 10000);

    function startSeleniumInstance() {
      selenium.start(options, function(err, child) {
        // child is a ChildProcess instance
        // http://nodejs.org/api/child_process.html#child_process_class_childprocess
        if (err) {
          clearTimeout(startTimeout);
          handleSpawnError(err, self, startOptions, resolve, reject);
          return;
        }
        self.server = child;
        self.serverOutput = '';
        log('selenium server ready');
        clearTimeout(startTimeout);
        resolve();
      });
    }

    if (startOptions.skipIfPortUsed) {
      tcpPortUsed.check(4444, process.env.SELENIUM_HOST || 'localhost').then(function(inUse) {
        if (inUse) {
          log('selenium server found');
          clearTimeout(startTimeout);
          resolve();
          return;
        }
        startSeleniumInstance();
      }, function(err) {
        console.error('Error checking selenium port:', err.message);
        startSeleniumInstance();
      });
      return;
    }
    startSeleniumInstance();
  });
  return this.startPromise;
};

StandaloneSelenium.prototype.install = function() {
  if (this.installPromise) {
    return this.installPromise;
  }

  let options = {
    logger: function(message) {
      log(message);
    }
  };
  log('installing selenium');
  this.installPromise = new Promise(function(resolve, reject) {
    selenium.install(options, function(err) {
      if (err) {
        handleInstallError(err);
        reject(err);
        return;
      }
      resolve();
    });
  });
  return this.installPromise;
};

StandaloneSelenium.prototype.kill = function() {
  if (!this.server) {
    return;
  }
  this.startPromise = null;
  this.server.kill();
  log('selenium server killed');
  this.server = null;
};

function handleInstallError(err) {
  console.log('Error installing selenium server:' +
    '\n    ' + chalk.red(err.message));
  console.log('try reinstalling with:' +
    '\n    ' + chalk.cyan('rm -rf node_modules/selenium-standalone/.selenium') +
    '\n    ' + chalk.cyan('npm run selenium-install'));
}

function handleSpawnError(err, server, startOptions, resolve, reject) {
  if (/Missing.+driver/i.test(err.message)) {
    console.log(err.message);
    server.install().then(function() {
      server.startPromise = null;
      return server.start(startOptions);
    }).then(resolve, reject);
    return;
  }
  console.log('Error spawning selenium server:' +
    '\n    ' + chalk.red(err.message));
  console.log('try reinstalling with:' +
    '\n    ' + chalk.cyan('rm -rf node_modules/selenium-standalone/.selenium') +
    '\n    ' + chalk.cyan('npm run selenium-install'));
  reject(err);
}

export default new StandaloneSelenium();
