import {defineSupportCode} from 'cucumber';
import pluginManager from '../../plugins/plugin-manager';

defineSupportCode(context => pluginManager.setHooks(context));
