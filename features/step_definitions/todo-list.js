import {expect} from 'chai';
import {defineSupportCode} from 'cucumber';

defineSupportCode(({Given, When, Then}) => {
  When('I add TODO "{text}"', async function(text) {
    this.newTodo = text;
    await this.page('todo-list').addTodo(this.newTodo);
  });

  Then('the new TODO is on the list', async function() {
    const list = await this.page('todo-list').getList();
    if (!this.newTodo) {
      throw new Error('there is no new TODO, did you add?');
    }
    expect(list.map(item => item.text)).to.contain(this.newTodo);
  });
});
