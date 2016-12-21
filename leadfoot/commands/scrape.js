function scrape(element, model) {
  if (!model) {
    model = element;
    element = null;
  }
  if (!model) {
    throw new Error('scrape error: no model specified');
  }
  stringifyFunctions(model);

  let promise = this.waitDataLoading();
  if (model.itemSelector) {
    // scrapping a list, wait a little more for the list to have items
    promise = promise.waitDataLoading({
      timeout: 3000,
      readyIndicator: model.itemSelector
    }).catch(function() {
      // ok, list is actually empty, continue
    });
  }
  return promise.executeSafe(function(element, model) {
    function scrapeValue(value) {
      if (typeof value !== 'string') {
        return value;
      }
      let valueMatch = /^(?:\$|usd)? *([\d,]+(?:\.[\d]*)?) *(?:\$|usd)?$/i.exec(value);
      if (valueMatch) {
        return parseFloat(valueMatch[1].replace(/,/g, ''));
      }
      valueMatch = /^(true|false|yes|no)$/i.exec(value);
      if (valueMatch) {
        return ['true', 'yes'].indexOf(valueMatch[1].toLowerCase()) >= 0;
      }
      return value;
    }

    function scrapeElement(elem, elemModel, singleItem) {
      if (!singleItem && elemModel.itemSelector) {
        let elemChildren = Array.prototype.slice.apply(elem.querySelectorAll(elemModel.itemSelector));
        return elemChildren.map(function(elemChild) {
          return scrapeElement(elemChild, elemModel, true);
        });
      }

      let calculatedProperties = {};
      let data = {};
      for (let name in elemModel) {
        if (name === 'itemSelector') {
          continue;
        }
        let propertyModel = elemModel[name];
        let value;
        if (/function\s*(.|\n)*\{(.|\n)*\}/i.test(propertyModel)) {
          try {
            /* eslint no-eval: off */
            propertyModel = elemModel[name] = eval('(' + propertyModel + ')');
          } catch (err) {
            throw new Error('error trying to eval: "(' + propertyModel + ')"');
          }
        }
        if (typeof propertyModel === 'string') {
          propertyModel = propertyModel.split('@');
          let propertyElement = elem;
          if (propertyModel[0]) {
            propertyElement = elem.querySelector(propertyModel[0]);
          }
          value = undefined;
          if (propertyElement) {
            if (propertyModel[1]) {
              value = propertyElement.getAttribute(propertyModel[1]);
            } else {
              if (propertyElement.value !== undefined) {
                value = propertyElement.value;
              } else {
                value = propertyElement.textContent.trim();
              }
            }
            value = scrapeValue(value);
          }
        } else if (typeof propertyModel === 'object') {
          value = scrapeElement(elem, propertyModel);
        } else if (typeof propertyModel === 'function') {
          // calculated property, evaluate later
          calculatedProperties[name] = propertyModel;
        } else {
          throw new Error('scrape error: invalid model specified');
        }
        data[name] = value;
      }
      // evaluate calculated properties
      for (let name in calculatedProperties) {
        try {
          data[name] = calculatedProperties[name].call(data, data, elem);
        } catch (err) {
          throw new Error('error calculating property ' + name + ': ' +
            err.message + ', data: ' + JSON.stringify(data));
        }
      }
      return data;
    }

    return scrapeElement(element || document, model);
  }, [element, model])
  .then(function(result) {
    return result;
  });
}

function stringifyFunctions(model) {
  if (typeof model !== 'object') {
    return model;
  }
  for (let name in model) {
    let value = model[name];
    if (typeof value === 'function') {
      let fnString = value.toString();
      if (/^[^{]+=>/.test(fnString)) {
        // arrow function, transpile for lame browsers
        fnString = fnString.replace(/^([^{]+)=>(.+)$/, function(match, args, body) {
          if (!/^\s*\(.*\)\s*$/.test(args)) {
            args = '(' + args + ')';
          }
          if (!/^\s*{.*}\s*$/.test(body)) {
            body = '{ return (' + body + ');}';
          }
          return 'function' + args + body;
        });
      } else {
        // named function, anonymize
        fnString = fnString.replace(/\s*[^(]+\s*\(/, 'function(');
      }
      model[name] = fnString;
    } else if (typeof value === 'object') {
      stringifyFunctions(value);
    }
  }
}

scrape.usesElement = true;
module.exports = scrape;
