module.exports = function fillField(name, valueToSet) {
  // TODO: find by label
  // TODO: support radio buttons (see webdriver-commands/fill-fields.js)
  let value = valueToSet;
  if (typeof value === 'number') {
    value = value.toString();
  }
  let selector = '[placeholder="' + name + '"]' +
    ',[name="' + name + '"]' +
    ',[id="' + name + '"]';

  let element = this.findByCssSelector(selector);

  return element.getAttribute('type').then(function(typeAttr) {
    if (typeAttr === 'checkbox') {
      if (typeof value !== 'boolean') {
        value = /^(on|true|t|yes|y|1|enabled?|active)$/i.test(value.toString());
      }
      return element.isSelected().then(function(currentValue) {
        if (value === currentValue) {
          return element;
        }
        return element.click();
      });
    }
    return element.getTagName().then(function(tagName) {
      if (tagName.toLowerCase() === 'select') {
        return element.click().type(value)
          .executeSafe(function(selector, value) {
            let elem = document.querySelector(selector);
            let valueOption = Array.prototype.filter.call(elem.options, function(option) {
              return option.value.toLowerCase() === value ||
                option.text.toLowerCase() === value;
            })[0];
            if (!valueOption) {
              throw new Error('option not found: ' + value);
            }
            elem.value = valueOption.value;
            /* global Event */
            elem.dispatchEvent(new Event('change'));
          }, [selector, value.toString().toLowerCase()]);
      }
      return element.click().type(value);
    });
  }).end();
};
