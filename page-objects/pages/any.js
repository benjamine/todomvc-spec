'use strict';
import {Page} from 'page-object-pattern';

export default class AnyPage extends Page {
  constructor(world) {
    super(world);
    this.error = this.element('page-error');
    this.footer = this.element('footer');
  }
}
