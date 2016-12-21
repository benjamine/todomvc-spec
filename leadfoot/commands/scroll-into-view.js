function scrollIntoView(element) {
  return this.executeSafe(function(element) {
    if (!element) {
      return;
    }

    if (typeof element.scrollIntoViewIfNeeded === 'function') {
      element.scrollIntoViewIfNeeded();
      return;
    }

    scrollIntoViewIfNeeded(element);

    function scrollIntoViewIfNeeded(element, centerIfNeeded) {
      centerIfNeeded = arguments.length === 0 ? true : !!centerIfNeeded;

      let parent = element.parentNode;
      let parentComputedStyle = window.getComputedStyle(parent, null);
      let parentBorderTopWidth = parseInt(parentComputedStyle.getPropertyValue('border-top-width'));
      let parentBorderLeftWidth = parseInt(parentComputedStyle.getPropertyValue('border-left-width'));
      let overTop = element.offsetTop - parent.offsetTop < parent.scrollTop;
      let overBottom = (element.offsetTop - parent.offsetTop + element.clientHeight -
          parentBorderTopWidth) > (parent.scrollTop + parent.clientHeight);
      let overLeft = element.offsetLeft - parent.offsetLeft < parent.scrollLeft;
      let overRight = (element.offsetLeft - parent.offsetLeft + element.clientWidth -
          parentBorderLeftWidth) > (parent.scrollLeft + parent.clientWidth);
      let alignWithTop = overTop && !overBottom;

      if ((overTop || overBottom) && centerIfNeeded) {
        parent.scrollTop = element.offsetTop - parent.offsetTop -
          parent.clientHeight / 2 - parentBorderTopWidth + element.clientHeight / 2;
      }

      if ((overLeft || overRight) && centerIfNeeded) {
        parent.scrollLeft = element.offsetLeft - parent.offsetLeft -
          parent.clientWidth / 2 - parentBorderLeftWidth + element.clientWidth / 2;
      }

      if ((overTop || overBottom || overLeft || overRight) && !centerIfNeeded) {
        element.scrollIntoView(alignWithTop);
      }
    }
  }, [element])
  .then(function(result) {
    return result;
  });
}

scrollIntoView.usesElement = true;
module.exports = scrollIntoView;
