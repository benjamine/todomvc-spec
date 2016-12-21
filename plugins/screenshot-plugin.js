'use strict';
import fs from 'fs';
import path from 'path';
import _s from 'underscore.string';
import _ from 'lodash';
import chalk from 'chalk';
import {Status} from 'cucumber';
import {execSync} from 'child_process';

class ScreenshotPlugin {

  extendWorld(world) {
    let config = world.config.screenshots;
    let projectRoot = path.join(__dirname, '..');
    let screenshotsPath = path.resolve(path.join(
      projectRoot, config.path));
    world.takeScreenshot = function(screenshotOptions = {}) {
      let world = this;
      let options = screenshotOptions;
      if (typeof options === 'string') {
        options = _.merge({}, arguments[1], {
          suffix: options
        });
      }

      if (options.suffix === 'checkpoint' && config.checkpoints &&
        config.checkpoints.disable) {
        return;
      }

      let scenario = options.scenario || world.scenario;

      let promise = world.browser;
      if (options.sleep) {
        promise = promise.sleep(options.sleep);
      }
      return promise.takeScreenshot().then(function(imageData) {
        try {
          let filename = options.filename;
          if (!filename) {
            filename = scenario.uri
              .replace(/\.feature(?::\d+)?$/, '/' + _s.slugify(scenario.name));
            if (options.addBrowserName !== false && world.browserName) {
              filename += '.' + world.browserName;
            }
            options.suffix = options.suffix || 'capture';

            let counters = scenario.screenshotCounters = scenario.screenshotCounters || {};
            let count = counters[options.suffix] = (counters[options.suffix] || 0) + 1;
            filename += '.n' + count + '.' + options.suffix;
          }
          if (!/\.png$/.test(filename)) {
            filename += '.png';
          }
          filename = path.join(screenshotsPath,
            path.relative(projectRoot, filename));

          let screenshotDir = path.dirname(filename);
          if (!fs.existsSync(screenshotDir)) {
            execSync(`mkdir -p ${screenshotDir}`);
          }

          fs.writeFileSync(filename, imageData);
          console.log(chalk.yellow('      screenshot saved at ' +
            path.relative(projectRoot, filename)));

          // TEMP: disable screenshot attaching, see https://github.com/cucumber/cucumber-js/pull/589
          options.attach = false;

          if (options.attach !== false) {
            scenario.attach(imageData, 'image/png', function(err) {
              if (err) {
                console.log(chalk.red('error attaching screenshot'), err);
                console.log(chalk.red(err.toString()));
                return;
              }
            });
          }
        } catch (err) {
          console.log(chalk.red('error saving screenshot'));
          console.log(chalk.red(err.toString()));
        }
      });
    };
  }

  afterScenario(world, scenarioResult) {
    if (scenarioResult.status !== Status.FAILED || !world.browser) {
      return;
    }

    return world.takeScreenshot({
      suffix: 'failure'
    })
    .executeSafe(function() {
      // take a 2nd screenshot, after a delay and an angular digest
      // (a missing digest is common source of many angular tricky bugs)
      if (window.angular) {
        try {
          let rootElement = document.querySelector('[ng-controller]');
          window.angular.element(rootElement).scope().$digest();
        } catch (err) {
          console.error(err);
        }
      }
    }).then(function() {
      return world.takeScreenshot({
        sleep: 1000,
        suffix: 'failure2'
      });
    });
  }

}

export default new ScreenshotPlugin();
