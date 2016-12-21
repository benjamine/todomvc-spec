let getter = function(element, selectors) {
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

  function getScreenStateFromSelector(selector) {
    let state = {
      selector: selector
    };
    let elem = selector === '.' ? element : (element || document).querySelector(selector);
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

  let single = typeof selectors === 'string';
  if (single) {
    selectors = [selectors];
  }
  let states;
  if (Array.isArray(selectors)) {
    states = [];
    for (let i = 0; i < selectors.length; i++) {
      states.push(getScreenStateFromSelector(selectors[i]));
    }
  } else {
    states = {};
    for (let name in selectors) {
      states[name] = getScreenStateFromSelector(selectors[name]);
    }
  }
  return single ? states[0] : states;
};

function getScreenState(element, selectors) {
  if (!(element && element.click)) {
    selectors = element;
    element = null;
  }
  if (!selectors) {
    selectors = '.';
  }

  let promise = this.waitDataLoading();
  return promise.execute(getter, [element, selectors]);
}

getScreenState.usesElement = true;
module.exports = getScreenState;
