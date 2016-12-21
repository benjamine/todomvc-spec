'use strict';
/*
  starts (or waits for) a selenium server.
*/
import standaloneSelenium from './standalone-selenium';

class SeleniumServerPlugin {

  initialize(config) {
    this.config = config;
  }

  beforeFeatures() {
    const config = this.config;
    if (config.spawnSelenium !== false &&
      (config.spawnSelenium || !/^http:\/\/localhost:4444\//.test(config.driver.server))) {
      const seleniumServerOptions = {};
      if (config.spawnSelenium === 'auto') {
        // spawn a selenium server only if there isn't one already running
        seleniumServerOptions.skipIfPortUsed = true;
      }
      return standaloneSelenium.start(seleniumServerOptions);
    }
  }

  afterFeatures() {
    return standaloneSelenium.kill();
  }

}

export default new SeleniumServerPlugin();
