import {defineSupportCode} from 'cucumber';
import _ from 'lodash';
import configuration from '../../plugins/configuration';
import pluginManager from '../../plugins/plugin-manager';

const config = configuration.load();

function CustomWorld() {
  this.config = _.cloneDeep(config);
  pluginManager.extendWorld(this);
}

defineSupportCode(function(context) {
  const {
    setWorldConstructor,
    setDefaultTimeout
  } = context;
  pluginManager.initialize(config, context);
  setDefaultTimeout(10 * 60 * 1000);
  setWorldConstructor(CustomWorld);
});
