'use strict';
/*
  Loads all plugins in /plugins/*-plugin.js, and calls them on cucumber events.
*/
import bulkRequire from 'bulk-require';
import chalk from 'chalk';

class PluginManager {

  initialize() {
    return this.callPlugins('initialize', {
      sync: true
    }, Array.from(arguments));
  }

  cli() {
    return this.callPlugins('cli', {
      sync: true
    }, Array.from(arguments));
  }

  extendWorld(world) {
    // as a workaround for https://github.com/cucumber/cucumber-js/issues/165
    // keep a reference to the world of scenario currently running
    this.currentWorld = world;

    return this.callPlugins('extendWorld', {
      sync: true
    }, Array.from(arguments));
  }

  beforeFeatures() {
    return this.callPlugins('beforeFeatures', {}, Array.from(arguments));
  }

  beforeScenario() {
    return this.callPlugins('beforeScenario', { /* log: true */ }, Array.from(arguments));
  }

  beforeStep() {
    return this.callPlugins('beforeStep', {
      sync: true
    }, Array.from(arguments));
  }

  afterStep() {
    return this.callPlugins('afterStep', {
      sync: true
    }, Array.from(arguments));
  }

  afterScenario() {
    let args = Array.from(arguments);
    return this.callPlugins('afterScenario', {}, args).then(() =>
      this.callPlugins('afterScenarioCleanup', {}, args)
    );
  }

  afterFeatures() {
    return this.callPlugins('afterFeatures', {}, Array.from(arguments));
  }

  callPlugins(functionName, options, args) {
    let pluginOptions = options;
    let pluginArgs = args;
    if (Array.isArray(options)) {
      pluginArgs = options;
      pluginOptions = {};
    }
    pluginOptions = pluginOptions || {};
    pluginArgs = pluginArgs || [];
    let results = this.getPluginsList().map(plugin => {
      if (typeof plugin[functionName] === 'function') {
        let result;
        try {
          result = plugin[functionName].apply(plugin, pluginArgs);
        } catch (err) {
          this.logAsPlugin(plugin, err);
          throw err;
        }
        if (result && typeof result.then === 'function') {
          if (pluginOptions.sync) {
            throw new Error('cannot return a promise from this method: ' + plugin.name + ', ' + functionName);
          }
          if (pluginOptions.log) {
            this.logAsPlugin(plugin, 'initializing');
            result.then(() => this.logAsPlugin(plugin, 'initialized'));
          }
          result.catch(err => this.logAsPlugin(plugin, err));
        }
        return result;
      }
    });
    if (pluginOptions.sync) {
      return results;
    }
    let result = Promise.all(results);
    if (pluginOptions.log) {
      result.then(() => this.log('all plugins initialized'));
    }
    return result;
  }

  logAsPlugin(plugin, msg) {
    let prefix = chalk.cyan('[' + plugin.name + '] ');
    if (msg instanceof Error) {
      console.log(prefix + chalk.red(msg.message));
      return;
    }
    console.log(prefix + msg);
  }

  log(msg) {
    let prefix = chalk.cyan('[plugins] ');
    console.log(prefix + msg);
  }

  getPlugins() {
    if (!this.plugins) {
      if (process.env.NOPLUGINS) {
        this.plugins = {};
      } else {
        this.plugins = bulkRequire(__dirname, [
          '*-plugin.js'
        ]);
      }
      Object.keys(this.plugins).forEach(name => {
        let plugin = this.plugins[name];
        if (plugin.default) {
          // support ES6 modules
          plugin = plugin.default;
          this.plugins[name] = plugin;
        }
        plugin.name = plugin.name || name;
        let manager = this;
        plugin.manager = manager;
        plugin.log = plugin.log || function log() {
          let args = Array.from(arguments);
          args.unshift(plugin);
          return manager.logAsPlugin.apply(manager, args);
        };
      });
    }
    return this.plugins;
  }

  getPluginsList() {
    let plugins = this.getPlugins();
    return Object.keys(plugins).map(name => plugins[name]);
  }

  setHooks(context) {
    let pluginManager = this;

    /* eslint new-cap:off */

    context.registerHandler('BeforeFeatures', features =>
      pluginManager.beforeFeatures(features)
    );

    context.registerHandler('BeforeScenario', scenario => {
      this.currentWorld.scenario = scenario;
      return pluginManager.beforeScenario(this.currentWorld);
    });

    context.registerHandler('ScenarioResult', scenarioResult => {
      this.currentWorld.scenarioResult = scenarioResult;
      pluginManager.afterScenario(this.currentWorld, scenarioResult);
    });

    context.registerHandler('BeforeStep', (step, callback) => {
      let currentWorld = this.currentWorld;
      if (!currentWorld) {
        return;
      }
      pluginManager.beforeStep(currentWorld, step);
      callback();
    });

    context.registerHandler('StepResult', (stepResult, callback) => {
      let currentWorld = this.currentWorld;
      if (!currentWorld) {
        return;
      }
      pluginManager.afterStep(currentWorld, stepResult);
      callback();
    });

    context.registerHandler('AfterFeatures', features =>
      pluginManager.afterFeatures(features)
    );
  }
}

export default new PluginManager();
