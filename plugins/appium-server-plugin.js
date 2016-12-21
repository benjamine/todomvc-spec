'use strict';
/*
  starts (or waits for) an appium server.
*/
import standaloneAppium from './standalone-appium';

class AppiumServerPlugin {

  beforeScenario(world) {
    let config = world.config;

    if (config.spawnAppium) {
      let appiumServerOptions = {};
      if (config.spawnAppium === 'auto') {
        // spawn an appium server only if there isn't one already running
        appiumServerOptions.skipIfPortUsed = true;
      }
      return standaloneAppium.start(appiumServerOptions);
    }
  }

  afterFeatures() {
    return standaloneAppium.kill();
  }
}

export default new AppiumServerPlugin();
