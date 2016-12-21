'use strict';
/*
  To create new plugins duplicate this file in the same folder,
  remove the -template suffix, and change _template by a good name.
  Only files that match /plugins/*-plugin.js are loaded as plugins.
  Also!, replace the comment block with a description of the plugin.
*/
class TemplatePlugin {

  initialize(config, context) {
    // before all features,
      // config: current config values loaded from /config folder
      // context: cucumber context ("this" in support files)
    // this is a synchronous-only method

    // use this.log for all output from this plugin
    this.log('initialize', context, config);
  }

  /*
  cli(program, config) {
    // optional, allows plugins to define CLI commands ("./run <command>")
    // program is a commander instance: https://github.com/tj/commander.js
    this.config = config;
    program.command(this.name)
      .description('the command description')
      .option('-f, --force', 'force run')
      .action((options) => {
        if (!options.force && !this.config.dontForce) {
          this.log('ignoring this run');
          return;
        }
        return this.doIt();
      });
  }
  */

  extendWorld(world) {
    // extend world, eg. adding members used step definitions
    // this is a synchronous-only method
    this.log('extending', world);
  }

  beforeFeatures(features) {
    // before all features
    // return a promise for async operations
    this.log('before features', features);
  }

  beforeScenario(world) {
    // initialize the world before scenario begins
    // return a promise for async operations
    this.log('initializing', world);
  }

  beforeStep(world, step) {
    // before each step in scenarios
    // this is a synchronous-only method
    this.log('before step', world, step);
  }

  afterStep(world, stepResult) {
    // after each step in scenarios
    // this is a synchronous-only method
    this.log('after step', world, stepResult);
  }

  afterScenario(world, scenarioResult) {
    // after each scenario is complete
    // return a promise for async operations
    this.log('after scenario', world, scenarioResult);
  }

  afterScenarioCleanup(world) {
    // cleanup after each scenario, runs after all plugins "afterScenario"s
    // return a promise for async operations
    this.log('after scenario cleanup', world);
  }

  afterFeatures(features) {
    // after all features/scenarios are complete
    // return a promise for async operations
    this.log('after features', features);
  }

}

export default new TemplatePlugin();
