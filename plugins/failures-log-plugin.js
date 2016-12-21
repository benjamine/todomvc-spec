/*
  logs failed scenarios to /output/failures.txt
*/
import fs from 'fs';
import path from 'path';
import {Status} from 'cucumber';

class FailuresLogPlugin {

  beforeScenario(world) {
    if (!this.initialized) {
      this.filename = path.join(__dirname, '..', 'output', 'failures.txt');
      this.failureCount = 0;
      world.failureLogFilename = this.filename;
      if (fs.existsSync(this.filename)) {
        fs.unlinkSync(this.filename);
      }
      this.initialized = true;
    }
  }

  afterScenario(world, scenarioResult) {
    if (scenarioResult.status !== Status.FAILED) {
      return;
    }
    let scenario = world.scenario;
    this.failureCount++;
    let error = scenarioResult.failureException;
    const shortUri = scenario.uri &&
      scenario.uri.replace(/^.*\/features\//, '/') ||
      'unknown';
    fs.appendFileSync(this.filename, 'Scenario Failed: ' + scenario.name +
      ' (' + shortUri + ':' + scenario.line + ')' +
      (error && error.message ? ', Error: ' + error.message : '') +
      '\n'
    );
  }

}

export default new FailuresLogPlugin();
