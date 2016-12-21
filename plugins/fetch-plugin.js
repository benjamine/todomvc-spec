'use strict';
/*
  customized fetch() for the current world instance
  (see https://github.com/benjamine/fetch-wrap )

  Usage:
  ``` js
  // on a step definition
  return this.fetch('{api}/users', {
    method: 'POST',
    body: {
      email: this.user.email,
      fistName: this.user.firstName,
      lastName: this.user.lastName,
      password: this.user.password
    }
  });
  ```
*/
import fetchPonyfill from 'fetch-ponyfill';
import fetchWrap from 'fetch-wrap';
import {
  optionsByUrlPattern,
  logger,
  urlParams,
  sendJSON,
  receiveJSON
} from 'fetch-wrap/middleware';
const fetch = fetchPonyfill().fetch;

class FetchPlugin {

  initialize(config) {
    this.config = config;
  }

  createFetch() {
    return fetchWrap(fetch, [
      urlParams(this.config.urlAliases),
      optionsByUrlPattern(this.config.fetchOptions),
      sendJSON(),
      logger({
        success: true
      }),
      receiveJSON()
    ]);
  }

  extendWorld(world) {
    world.fetch = this.createFetch();
  }
}

export default new FetchPlugin();
