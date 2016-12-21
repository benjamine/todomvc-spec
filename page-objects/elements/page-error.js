'use strict';
import {Element} from 'page-object-pattern';

export default class PageError extends Element {
  elements() {
    return this.browser.findAllByCssSelector(
      '.form-failure .form-failure-message,' +
      '.submitted .error-summary .error-reason'
    );
  }

  messages() {
    return this.elements().then(errorElements =>
      Promise.all(errorElements.map(errorElements => errorElements.getVisibleText())));
  }
}
