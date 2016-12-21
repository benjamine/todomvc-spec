'use strict';
import _ from 'lodash';
import peopleNames from 'people-names';

class UsersPlugin {
  extendWorld(world) {
    world.user = _.cloneDeep(world.config.users.default);
    this.extendUserObject(world.user, world);
  }

  extendUserObject(user, world) {
    let plugin = this;
    _.merge(user, {
      createRandom: function() {
        let user = _.cloneDeep(this);
        plugin.randomize(user);
        return user;
      },
      randomize: function() {
        plugin.randomize(this);
      },
      select: function(name) {
        let user = world.config.users[name];
        if (!user) {
          throw new Error('user not found in config: ' + name);
        }
        _.merge(this.user, _.cloneDeep(user));
      }
    });
  }

  randomize(user) {
    user.email = user.email.replace(/\+.*@/, '+rnd' +
      Math.floor(Math.random() * 1e5) + '@');
    user.firstName = peopleNames().allRandomEn();
    user.lastName = peopleNames().allRandomEs();
  }
}

export default new UsersPlugin();
