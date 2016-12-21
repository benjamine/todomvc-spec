'use strict';
/*
  adds support to page-objects (see: https://github.com/benjamine/page-object-pattern )
  loads pages from /page-objects/pages and page elements from /page-objects/elements

  Note: this implementation requires browser-plugin to visit pages and find elements

  Usage:
  ``` js
    // on a step definition

    // this calls placeOrder() at /page-objects/pages/checkout.js
    return this.page('checkout').placeOrder();
    // this calls signIn() at /page-objects/pages/any.js
    return this.page().signIn();
    // this visits a url like /product/123, using .route at /page-objects/pages/product.js
    return this.page('product').visit({ productId: 123 });
  ```
*/
import path from 'path';
import url2 from 'url2';
let PageManager = require('page-object-pattern').PageManager;
import bulkRequire from 'bulk-require';

class PageObjectsPlugin {
  extendWorld(world) {
    let pageManager = new PageManager(world);
    let dir = path.join(__dirname, '..', 'page-objects');
    let objects = bulkRequire(dir, ['pages/*.js', 'elements/*.js']);

    Object.keys(objects.pages).forEach(name => {
      if (objects.pages[name].default) {
        // support ES6 modules
        objects.pages[name] = objects.pages[name].default;
      }
    });
    Object.keys(objects.elements).forEach(name => {
      if (objects.elements[name].default) {
        // support ES6 modules
        objects.elements[name] = objects.elements[name].default;
      }
    });

    pageManager.define(objects.pages);
    pageManager.define(objects.elements);

    // functions used internally by page objects
    world.findByCssSelector = function(selector) {
      return this.browser.findByCssSelector(selector);
    };
    world.visitAbsoluteUrl = function(url, pageReload) {
      let self = this;
      return this.browser.getCurrentUrl().then(function(currentUrl) {
        if (url === currentUrl) {
          return;
        }

        if (pageReload !== true) {
          let relativeUrl = makeRelativeUrl(currentUrl, url);
          if (relativeUrl !== url) {
            // relative url, use js navigate to avoid a page reload if not needed
            // (this is equivalent to clicking a link)
            return self.browser.executeSafe(function(relativeUrl) {
              let a = document.createElement('a');
              a.setAttribute('href', relativeUrl);
              a.setAttribute('style', 'display:none;');
              document.body.appendChild(a);
              a.click();
              a.remove();
            }, [relativeUrl]);
          }
        }

        return self.browser.get(url);
      });
    };

    function makeRelativeUrl(fromUrl, toUrl) {
      let toUrlHashSplit = toUrl.split('#');
      if (fromUrl.split('#')[0] === toUrlHashSplit[0]) {
        return '#' + toUrlHashSplit[1];
      }
      return url2.relative(fromUrl, toUrl);
    }
  }
}

export default new PageObjectsPlugin();
