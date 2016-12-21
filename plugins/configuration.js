'use strict';
import _ from 'lodash';
import path from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

class Configuration {
  load(names) {
    let configNames = names || ('base,users,' + process.env.CONFIG);
    let configOptions = {};
    configNames.split(/[ ,+]+/g).forEach(name => {
      if (!name) {
        return;
      }
      let filename = path.join(__dirname, '..', 'config', name + '.yml');
      if (!fs.existsSync(filename)) {
        return;
      }
      let contents = fs.readFileSync(filename).toString();
      contents = _.template(contents)({
        env: process.env
      });
      let configValues = yaml.safeLoad(contents);
      _.merge(configOptions, configValues);
    });
    return configOptions;
  }

  save(name, data) {
    let filename = path.join(__dirname, '..', 'config', name.trim() + '.yml');
    fs.writeFileSync(filename, yaml.safeDump(data));
  }
}

export default new Configuration();
