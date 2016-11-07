/*
 * Copyright 2016 Hippo B.V. (http://www.onehippo.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

class DomService {

  constructor($q, $rootScope, $document) {
    'ngInject';

    this.$q = $q;
    this.$rootScope = $rootScope;
    this.$document = $document;
    this._scrollBarWidth = 0;
  }

  getAppRootUrl() {
    const location = this.$document[0].location;
    const appPath = location.pathname.substring(0, location.pathname.lastIndexOf('/') + 1);
    return `//${location.host}${appPath}`;
  }

  addCss(window, url) {
    return $.get(url, (response) => {
      const link = $(`<style>${response}</style>`);
      $(window.document).find('head').append(link);
    });
  }

  addScript(window, url) {
    return this.$q((resolve, reject) => {
      const script = window.document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.addEventListener('load', () => this.$rootScope.$apply(resolve));
      script.addEventListener('error', () => this.$rootScope.$apply(reject));
      window.document.body.appendChild(script);
    });
  }

  copyComputedStyleExcept(fromElement, toElement, excludedProperties) {
    const excludeRegExp = this._createExcludeRegexp(excludedProperties);
    this._doCopyComputedStyleExcept(fromElement, toElement, excludeRegExp);
  }

  _createExcludeRegexp(excludedProperties) {
    if (!excludedProperties) {
      return null;
    }
    return new RegExp(excludedProperties.join('|'));
  }

  _doCopyComputedStyleExcept(fromElement, toElement, excludeRegExp) {
    const fromComputedStyle = fromElement.ownerDocument.defaultView.getComputedStyle(fromElement, null);
    const toComputedStyle = toElement.ownerDocument.defaultView.getComputedStyle(toElement, null);
    const cssDiff = [];

    for (let i = 0, fromLength = fromComputedStyle.length; i < fromLength; i += 1) {
      const cssPropertyName = fromComputedStyle.item(i);
      if (!excludeRegExp || !excludeRegExp.test(cssPropertyName)) {
        const fromValue = fromComputedStyle.getPropertyValue(cssPropertyName);
        if (fromValue && fromValue.length) {
          const toValue = toComputedStyle.getPropertyValue(cssPropertyName);
          if (fromValue !== toValue) {
            cssDiff.push(`${cssPropertyName}:${fromValue}`);
          }
        }
      } else {
        const toStyleValue = toElement.style.getPropertyValue(cssPropertyName);
        if (toStyleValue && toStyleValue.length) {
          cssDiff.push(`${cssPropertyName}:${toStyleValue}`);
        }
      }
    }

    if (cssDiff.length) {
      toElement.style.cssText = cssDiff.join(';');
    }
  }

  copyComputedStyleOfDescendantsExcept(fromElement, toElement, excludedProperties) {
    const excludeRegExp = this._createExcludeRegexp(excludedProperties);

    const fromChildren = $(fromElement).children();
    const toChildren = $(toElement).children();

    // detach the elements that will get styles added to prevent DOM reflows; this speeds up IE11 4x
    toChildren.detach();
    this._doCopyComputedStylesExcept(fromChildren, toChildren, excludeRegExp);
    toChildren.appendTo(toElement);
  }

  _doCopyComputedStylesExcept(fromElements, toElements, excludeRegExp) {
    fromElements.each((index, fromElement) => {
      const toElement = toElements[index];
      this._doCopyComputedStyleExcept(fromElement, toElement, excludeRegExp);

      const fromChildren = $(fromElement).children();
      const toChildren = $(toElement).children();
      this._doCopyComputedStylesExcept(fromChildren, toChildren, excludeRegExp);
    });
  }

  createMouseDownEvent(view, clientX, clientY) {
    // IE11 needs type 'MSPointerDown' instead of 'mousedown'
    const type = window.navigator.msPointerEnabled ? 'MSPointerDown' : 'mousedown';
    const canBubble = true;
    const cancelable = false;
    const detail = 0;
    const screenX = 0;
    const screenY = 0;
    const ctrlKey = false;
    const altKey = false;
    const shiftKey = false;
    const metaKey = false;
    const button = 0;
    const relatedTarget = null;

    // IE11 does not support new MouseEvent(), so use the deprecated initMouseEvent() method instead
    const mouseEvent = view.document.createEvent('MouseEvent');
    mouseEvent.initMouseEvent(type, canBubble, cancelable, view, detail, screenX, screenY, clientX, clientY,
      ctrlKey, altKey, shiftKey, metaKey, button, relatedTarget);
    return mouseEvent;
  }

  getScrollBarWidth() {
    if (!this._scrollBarWidth) {
      const outerWidth = 100;
      const $outer = $('<div>').css({
        visibility: 'hidden',
        width: outerWidth,
        overflow: 'scroll',
      }).appendTo('body');
      const widthWithScroll = $('<div>').css('width', '100%')
        .appendTo($outer)
        .outerWidth();
      $outer.remove();
      this._scrollBarWidth = outerWidth - widthWithScroll;
    }
    return this._scrollBarWidth;
  }

  getBottom(element) {
    const rectBottom = element.getBoundingClientRect().bottom;
    const marginBottomPx = element.ownerDocument.defaultView.getComputedStyle(element).marginBottom;
    const marginBottom = parseInt(marginBottomPx, 10);
    return rectBottom + marginBottom;
  }

  isVisible(jqueryElement) {
    let isVisible = jqueryElement.is(':visible');
    if (isVisible) {
      const style = window.getComputedStyle(jqueryElement[0]);
      isVisible = style.visibility !== 'hidden';
    }
    return isVisible;
  }
}

  getLowestElementBottom(document) {
    const allElements = document.querySelectorAll('body *');
    const count = allElements.length;
    let lowest = 0;

    // use plain for-loop for performance
    for (let i = 0; i < count; i += 1) {
      const bottom = this.getBottom(allElements[i]);
      if (bottom > lowest) {
        lowest = bottom;
      }
    }

    return lowest;
  }
}

export default DomService;
