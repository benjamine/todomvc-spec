'use strict';
import {Element} from 'page-object-pattern';

export default class Footer extends Element {
  visit(footerLinkName) {
    return this.browser
      .findByPartialLinkText(footerLinkName.trim().toUpperCase())
      .click().end();
  }
}
