module.exports = function clickSubmit() {
  return this.findByCssSelector('[type=submit]').click().end();
};
