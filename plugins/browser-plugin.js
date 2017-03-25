'use strict';
/*
  prepares a browser (leadfoot) session for each scenario.
  see https://theintern.github.io/leadfoot/ for details

  Usage:
  ``` js
  // on a step definition
  return this.browser.findByCssSelector('button').click().end();
  ```
*/
import BrowserPool from './browser-pool';

class BrowserPlugin {

  extendWorld(world) {
    // patch leadfoot classes (fixes issues and adds custom commands)
    require('../leadfoot/patch')(world.config);

    let pool = this.getPool(world);
    pool.log = this.log.bind(this);

    world.releaseBrowser = function() {
      if (!world.browser) {
        return;
      }
      if (world.config.reuseBrowser) {
        pool.reuse(world.browser);
      } else {
        world.browser.session.quit();
        world.browser = null;
      }
    };
    world.releaseAllBrowsers = function() {
      pool.releaseAll();
    };
  }

  beforeScenario(world) {
    if (!this.pool) {
      this.pool = new BrowserPool(world.config);
    }
    return this.getPool(world).next(world).then(result => {
      world.browser = result.browser;
      world.browser.session.world = world;
      world.browserName = result.browserName;
    });
  }

  afterScenarioCleanup(world) {
    if (world.releaseBrowser) {
      world.releaseBrowser();
    }
  }

  afterFeatures() {
    if (!this.pool) {
      return;
    }
    return this.pool.releaseAll();
  }

  getPool(world) {
    if (!this.pool) {
      this.pool = new BrowserPool(world.config);
    }
    return this.pool;
  }
}

export default new BrowserPlugin();
