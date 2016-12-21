import os from 'os';
import {execSync} from 'child_process';
import LeadfootServer from 'leadfoot/Server';
import LeadfootCommand from 'leadfoot/Command';
import promiseRetry from 'promise-retry';

class BrowserPool {

  constructor(config) {
    this.config = config;
    this.poolSize = Math.max(parseInt((config.browserPoolSize || '1').toString()), 1);
    this.browsers = [];
    this.browsersCreated = [];
    this.sessionsCreated = [];
  }

  next() {
    this.prepare();
    return this.browsers.shift();
  }

  reuse(browser) {
    this.browsers.push(browser
      // try to cleanup this browser as much as possible
      .execute(function() {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
      })
      .clearCookies()
      .then(function() {
        return browser.clearLocalStorage().clearSessionStorage().catch(function() {
          return browser.execute(function() {
            window.localStorage.clear();
            window.sessionStorage.clear();
          });
        });
      })
      .get(this.config.baseUrl + this.config.initialPath)
      .execute(function() {
        document.body.scrollTop = document.documentElement.scrollTop = 0;
      })
      .then(() => ({
        browser: browser,
        browserName: this.config.driver.desiredCapabilities.browserName &&
          this.config.driver.desiredCapabilities.browserName.toLowerCase()
      }))
    );
  }

  releaseAll() {
    this.browsers = [];
    const onQuitError = err => {
      if (/ECONN/.test(err.message)) {
        return;
      }
      this.log('error releasing browser session', err.message);
    };
    let promises = this.sessionsCreated.map(session => {
      try {
        return session.quit().catch(onQuitError);
      } catch (err) {
        onQuitError(err);
      }
    });
    this.sessionsCreated = [];
    promises = promises.concat(this.browsersCreated.map(promise =>
      promise.then(result => result.browser.session.quit())
      .catch(onQuitError)
    ));
    return Promise.all(promises);
  }

  prepare() {
    while (this.browsers.length < this.poolSize) {
      let browser = this.getNewBrowser();
      this.browsers.push(browser);
      this.browsersCreated.push(browser);
    }
  }

  getServer() {
    if (!this.server) {
      let webDriverOptions = this.config.driver;
      this.server = new LeadfootServer(webDriverOptions.server);
      if (webDriverOptions.fixSessionCapabilities === false) {
        this.server.fixSessionCapabilities = false;
      }
    }
    return this.server;
  }

  getNewBrowser() {
    let desiredCapabilities = this.config.driver.desiredCapabilities;
    if (desiredCapabilities.browserName === 'chrome') {
      if (os.type() === 'Darwin') {
        // support non-standard chrome location in OSX (eg. if you use brew cask)
        const binary = execSync(
          `osascript -e 'POSIX path of (path to application "Chrome")'`)
        .toString().trim() +
        'Contents/MacOS/Google Chrome';
        desiredCapabilities.chromeOptions = {
          binary
        };
      }
    }
    return promiseRetry(retry =>
      this.getServer().createSession(desiredCapabilities).then(session => {
        session.setFindTimeout(this.config.implicitWait || 5000);
        session.setTimeout('script', this.config.executeAsyncTimeout || 30000);
        this.sessionsCreated.push(session);
        let browserPromise = new LeadfootCommand(session);
        if (this.config.driver.windowSize) {
          let size = this.config.driver.windowSize;
          browserPromise = browserPromise.setWindowSize(size.width, size.height);
        }
        return browserPromise
          .get(this.config.baseUrl + this.config.initialPath)
          .then(() => ({
            browser: new LeadfootCommand(session),
            browserName: desiredCapabilities.browserName &&
              desiredCapabilities.browserName.toLowerCase()
          }));
      }).catch(retry),
      {
        retries: 3
      }
    );
  }
}

module.exports = BrowserPool;
