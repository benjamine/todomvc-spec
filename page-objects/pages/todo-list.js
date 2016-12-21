'use strict';
import AnyPage from './any';
import keys from 'leadfoot/keys';

export default class TodoListPage extends AnyPage {
  constructor(world) {
    super(world);
    this.route = '/#/:filter';
  }

  addTodo(text) {
    return this.browser
      .fillFields({
        'What needs to be done?': text
      })
      .pressKeys(keys.ENTER);
  }

  getList() {
    return this.browser
      .findByCssSelector('.todo-list').end()
      .scrape({
        itemSelector: '.todo-list li',
        text: 'label',
        classes: '@class',
        completed: data => /completed/.test(data.classes)
      });
  }
}
