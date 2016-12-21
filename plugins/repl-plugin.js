'use strict';
/*
  creates a REPL sessions for debugging where the current world,
   and browser session can be inspected.

  use env var REPLONFAIL=true to automatically start REPL after a failure

  Usage:
  ``` js
    // on step definition
    retunr this.repl();
  ```
*/
import replMode from './repl-mode';
import {Status} from 'cucumber';

class ReplPlugin {

  extendWorld(world) {
    let config = world.config.repl || {};
    this.config = config;
    world.repl = function() {
      return replMode(world);
    };
  }

  afterScenario(world, scenarioResult) {
    if (scenarioResult.status !== Status.FAILED || !this.config.onFailure) {
      return;
    }
    return replMode(world);
  }

}

export default new ReplPlugin();
