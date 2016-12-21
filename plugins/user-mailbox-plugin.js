'use strict';
import EmailClient from './email-client';
import configuration from './configuration';

class UserMailboxPlugin {

  extendWorld(world) {
    // user mailbox client
    let userMailbox;
    world.userMailbox = function() {
      if (!(this.user && this.user.email)) {
        throw new Error('there\'s no user email in current world');
      }
      if (!userMailbox || userMailbox.email !== this.user.email) {
        if (userMailbox) {
          userMailbox.close();
        }
        let gmailConfig = configuration.load('gmail');
        userMailbox = new EmailClient({
          email: this.user.email,
          password: gmailConfig.gmail.password,
          oauth: gmailConfig.gmail.oauth
        });
      }
      return userMailbox;
    };
    world.userMailboxClose = function() {
      if (!userMailbox) {
        return;
      }
      userMailbox.close();
      userMailbox = null;
    };
  }

  afterScenario(world) {
    if (world.userMailboxClose) {
      world.userMailboxClose();
    }
  }
}

export default new UserMailboxPlugin();
