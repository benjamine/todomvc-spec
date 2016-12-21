/*
  patches .click() to use javascript (instead of native click),
  use this (only) when native click is broken on a driver:

  this checks that the element is visible and can be clicked (in the center of the element)

  ChromeDriver click has a few issues:
    https://sites.google.com/a/chromium.org/chromedriver/help/clicking-issues
*/

import LeadfootElement from 'leadfoot/Element';
import promiseRetry from 'promise-retry';

module.exports = function() {
  LeadfootElement.prototype.click = function() {
    return promiseRetry(retry => this.session.execute(function(element) {
      function getRect(elem) {
        return elem.getBoundingClientRect();
      }

      function getElementShortDescription(elem) {
        let desc = elem.tagName;
        if (elem.id) {
          desc += '#' + elem.id;
        }
        if (elem.getAttribute('class')) {
          desc += '.' + elem.getAttribute('class').split(/\s+/g).join('.');
        }
        return desc;
      }

      function isDescendant(parent, child) {
        let node = child.parentNode;
        while (node) {
          if (node === parent) {
            return true;
          }
          node = node.parentNode;
        }
        return false;
      }

      function getScreenStateOfElement() {
        let state = {};
        let elem = element;
        if (!elem) {
          state.found = false;
          return state;
        }
        state.found = true;
        let style = elem.currentStyle || window.getComputedStyle(elem);
        if (style && (style.display === 'none' || style.visibility === 'hidden')) {
          state.visible = false;
          return state;
        } else if (style) {
          state.visible = true;
        }

        let rect = state.rect = getRect(elem);
        if (rect && (rect.width <= 0 || rect.height <= 0)) {
          state.visible = false;
          return state;
        }
        let elementFromPoint = document.elementFromPoint(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2);
        if (elementFromPoint && elem !== elementFromPoint && !isDescendant(elem, elementFromPoint)) {
          state.otherElementIsOnTop = true;
          state.otherElementDescription = getElementShortDescription(elementFromPoint);
          state.clickable = false;
        } else {
          state.clickable = !elem.disabled;
        }

        state.inViewport = (rect.top + rect.height > 0 &&
          rect.top < window.screen.height &&
          rect.left + rect.width > 0 &&
          rect.left < window.screen.width);

        return state;
      }

      let state = getScreenStateOfElement();

      if (!state.found) {
        return {
          error: 'element not found'
        };
      }
      if (!state.visible) {
        return {
          error: 'element is not visible'
        };
      }
      if (state.otherElementIsOnTop) {
        let rect = state.rect;
        return {
          error: 'another element is on top (' + state.otherElementDescription +
            ' at ' + Math.round(rect.left + rect.width / 2) + ',' +
            Math.round(rect.top + rect.height / 2) + ')'
        };
      }
      if (!state.clickable) {
        return {
          error: 'element is not clickable'
        };
      }

      element.click();

      return state.rect;
    }, [this]).then(function(result) {
      if (!result) {
        return;
      }
      if (result.error) {
        throw new Error('cannot click: ' + result.error);
      }
    }).catch(err => {
      if (/not (visible|clickable|found)/i.test(err.message)) {
        return retry(err);
      }
      throw err;
    }), {
      retries: 5,
      minTimeout: 100
    });
  };
};
