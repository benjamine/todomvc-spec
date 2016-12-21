'use strict';
/*
  creates a local http proxy. it can be used to proxy the site being tested.

  NOTE: this is useful to test https sites as http, needed for iOS simulator,
    iOS safari execute_async never returns on https sites (see https://github.com/appium/appium/issues/3471 )
*/
import https from 'https';
import httpProxy from 'http-proxy';

class HttpProxyPlugin {

  constructor() {
    this.proxies = [];
    this.started = false;
  }

  beforeScenario(world) {
    if (this.started) {
      return;
    }
    let config = world.config;
    if (!config.localProxies) {
      return;
    }
    if (config.localProxies.baseUrl) {
      let targetUrl = config.baseUrl;
      config.baseUrl = 'http://localhost:8810';
      let proxy = httpProxy.createProxyServer({
        target: targetUrl,
        agent: https.globalAgent,
        headers: {
          host: /\/\/([^/]*)/.exec(targetUrl)[1]
        }
      });
      proxy.listen(8810);
      this.proxies.push(proxy);
      this.log(config.baseUrl + ' -> ' + targetUrl);
    }
    this.started = true;
  }

  afterFeatures() {
    this.proxies.forEach(function(proxy) {
      proxy.close();
    });
    this.proxies.length = 0;
  }

}

export default new HttpProxyPlugin();
