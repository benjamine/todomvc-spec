'use strict';
import {Status} from 'cucumber';
import chalk from 'chalk';

class TimingsPlugin {

  initialize() {
    this.scenarioTimings = [];
  }

  extendWorld(world) {
    world.startTime = new Date();
  }

  beforeStep(world, step) {
    world.stepTimings = world.stepTimings || [];
    world.stepTimings.push({
      name: step.name,
      startTime: new Date()
    });
  }

  afterStep(world, stepResult) {
    try {
      let stepTimings = world.stepTimings;
      if (!stepTimings) {
        return;
      }
      let timing = stepTimings[stepTimings.length - 1];
      if (!timing) {
        return;
      }
      if (stepResult.status === Status.FAILED) {
        timing.failed = true;
      }
      timing.elapsedSeconds = Math.round((new Date().getTime() - timing.startTime.getTime()) / 100) / 10.0;
    } catch (err) {
      console.error(err);
    }
  }

  afterScenario(world, scenarioResult) {
    // scenario failed, show extra debug info
    let scenario = world.scenario;
    let stepTimings = world.stepTimings;
    let msg = [];
    if (stepTimings && stepTimings.length &&
      scenarioResult.status === Status.FAILED &&
      !process.env.SILENT) {
      msg.push(' -- FAILED SCENARIO TIMINGS --');
      msg.push('Start: ' + stepTimings[0].startTime);
      msg.push(stepTimings.map(function(step) {
        let color = step.elapsedSeconds > 10 ? chalk.red : chalk.cyan;
        return step.name + ' - ' + color(step.elapsedSeconds + 's');
      }).join('\n'));
      msg.push(' ----');
      this.log(msg.join('\n'));
    }
    const shortUri = scenario.uri &&
      scenario.uri.replace(/^.*\/features\//, '/') ||
      'unknown';
    this.scenarioTimings.push({
      name: scenario.name,
      failed: scenarioResult.status === Status.FAILED,
      uri: shortUri + ':' + scenario.line,
      elapsedSeconds: Math.round((new Date().getTime() - world.startTime.getTime()) / 1000)
    });
  }

  afterFeatures() {
    if (this.scenarioTimings.length < 1) {
      return;
    }
    let msg = [' scenario timings:'];
    this.scenarioTimings.forEach(timing => msg.push(
      (timing.failed ? chalk.red(timing.name) : timing.name) +
      ' (' + timing.uri + ') - ' + this.formatSeconds(timing.elapsedSeconds)
    ));
    this.log(msg.join('\n'));
  }

  formatSeconds(seconds) {
    const leftPad = (value, char, length) => {
      let str = value.toString();
      while (str.length < length) {
        str = char + str;
      }
      return str;
    };
    return Math.floor(seconds / 60) + ':' + leftPad(seconds % 60, '0', 2);
  }

}

export default new TimingsPlugin();
