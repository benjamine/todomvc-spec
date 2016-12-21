module.exports = function fillFields(values) {
  let promise = this;
  if (values) {
    for (let name in values) {
      if (values[name] === undefined) {
        continue;
      }

      promise = promise.fillField(name, values[name]);
    }
  }
  return promise;
};
