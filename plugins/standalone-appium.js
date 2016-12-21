import chalk from 'chalk';
import childProcess from 'child_process';
import tcpPortUsed from 'tcp-port-used';

function StandaloneAppium() {}

function log() {
  if (process.env.SILENT) {
    return;
  }
  return console.log.apply(console, arguments);
}

StandaloneAppium.prototype.start = function(startOptions) {
  if (this.startPromise) {
    return this.startPromise;
  }

  let self = this;
  let options = {
    // spawn options for the appium server (see child_process.spawn)
    spawnOptions: {
      stdio: process.env.SELENIUMDEBUG ? 'inherit' : 'pipe'
    },
    // options to pass to `appium`
    appiumArgs: []
  };

  this.startPromise = new Promise(function(resolve, reject) {
    let startTimeout;

    function setStartTimeout(ms) {
      if (startTimeout) {
        clearTimeout(startTimeout);
      }
      startTimeout = setTimeout(function() {
        console.log(chalk.cyan('[appium] ') + ' start timeout');
        if (self.server) {
          self.server.kill();
          self.server = null;
        }
        console.log('====== SERVER OUTPUT ======');
        console.log(self.serverOutput || '(no output)');
        console.log('======    END        ======');
        reject(new Error('timeout waiting for appium server to be ready'));
      }, ms || 10000);
    }
    setStartTimeout();

    function startAppiumInstance() {
      self.server = childProcess.spawn('./appium-start', options.appiumArgs, options.spawnOptions);
      self.serverOutput = '';
      self.server.stdout.on('data', function(bufferData) {
        if (self.started) {
          return;
        }
        const data = bufferData.toString();
        self.serverOutput += data;
        if (/installing appium/.test(data)) {
          console.log(chalk.cyan('[appium] ') + data);
          setStartTimeout(120000);
        }
        if (/appium installed/.test(data)) {
          console.log(chalk.cyan('[appium] ') + data);
          setStartTimeout();
        }
        if (!/started.*4723/.test(data)) {
          // not ready yet
          return;
        }
        self.started = true;
        log('appium server ready');
        clearTimeout(startTimeout);
        resolve();
      });
      self.server.stderr.on('data', function(bufferData) {
        const data = bufferData.toString();
        console.log(chalk.cyan('[appium] ') + chalk.red(data));
        self.serverOutput += data;
      });
      self.server.on('exit', function(code) {
        if (code === 0 || code === null) {
          return;
        }
        clearTimeout(startTimeout);
        handleSpawnError(new Error('process exit with code ' + code), self, startOptions, resolve, reject);
        return;
      });
    }

    if (startOptions.skipIfPortUsed) {
      tcpPortUsed.check(4723, process.env.SELENIUM_HOST || 'localhost').then(function(inUse) {
        if (inUse) {
          log('appium server found');
          clearTimeout(startTimeout);
          resolve();
          return;
        }
        startAppiumInstance();
      }, function(err) {
        console.error('Error checking appium port:', err.message);
        startAppiumInstance();
      });
      return;
    }
    startAppiumInstance();
  });
  return this.startPromise;
};

StandaloneAppium.prototype.kill = function() {
  let startPromise = this.startPromise;
  if (!this.server) {
    if (startPromise) {
      this.startPromise = null;
      startPromise.then(() => {
        this.kill();
      });
    }
    return;
  }
  this.startPromise = null;
  this.server.kill();
  this.server = null;
};

function handleSpawnError(err, server, startOptions, resolve, reject) {
  console.log('Error spawning appium server:' +
    '\n    ' + chalk.red(err.message));
  console.log('try reinstalling with:' +
    '\n    ' + chalk.cyan('npm uninstall -g appium') +
    '\n    ' + chalk.cyan('npm install -g appium') +
    '\n    ' + chalk.cyan('sudo authorize-ios') +
    '\n    ' + chalk.cyan('see: https://github.com/appium/appium/blob/master/docs/en/appium-setup/running-on-osx.md')
  );
  reject(err);
}

export default new StandaloneAppium();
