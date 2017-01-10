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

const IFRAME_FADE_IN_DURATION_MS = 150;

class ScalingService {

  constructor($rootScope, $window, ViewportService) {
    'ngInject';

    this.$rootScope = $rootScope;
    this.ViewportService = ViewportService;

    this.pushWidth = 0; // all sidenavs are initially closed
    this.scaleFactor = 1.0;
    this.animating = false;

    $($window).on('resize', () => {
      $rootScope.$apply(() => this._updateScaling(false));
    });
  }

  init(hippoIframeJQueryElement, canvasJQueryElement, iframeJQueryElement) {
    this.hippoIframeJQueryElement = hippoIframeJQueryElement;
    this.canvasJQueryElement = canvasJQueryElement;
    this.iframeJQueryElement = iframeJQueryElement;
  }

  setPushWidth(pushWidth, animate = true) {
    this.pushWidth = pushWidth;
    this._updateScaling(animate);
  }

  sync() {
    this._updateScaling(true);
  }

  onIframeUnload() {
    if (this.iframeJQueryElement && this._isScaled()) {
      // Hide the iframe when scaled to avoid visual flicker. The contents inside the iframe is scaled because scaling
      // the iframe element itself results in ugly scrollbars. But the contents can only be scaled once loaded. Showing
      // unscaled contents first before scaling it down results in visual flicker, so we hide the whole iframe and show
      // it again when the new contents in the iframe is ready.
      this.iframeJQueryElement.hide();
    }
  }

  onIframeReady() {
    if (this.iframeJQueryElement) {
      this._scaleIframe(1.0, this.scaleFactor, false, []);
      if (this._isScaled()) {
        // use fadeIn() instead of show() to smoothen the transition from seeing the canvas to seeing the site
        this.iframeJQueryElement.fadeIn(IFRAME_FADE_IN_DURATION_MS);
      }
    }
  }

  isAnimating() {
    return this.animating;
  }

  getScaleFactor() {
    return this.scaleFactor;
  }

  _isScaled() {
    return this.scaleFactor !== 1.0;
  }

  /**
   * Update the iframe shift, if necessary
   *
   * The iframe should be shifted right (by controlling the left-margin) if the sidenav is open,
   * and if the viewport width is less than the available canvas
   *
   * @param animate  flag indicating whether any shift-change should be automated or immediate.
   * @returns {*[]}  canvasWidth is the maximum width available to the iframe
   *                 viewPortWidth indicates how many pixels wide the iframe content should be rendered.
   */
  _updateIframeShift(animate) {
    const canvasWidth = this.canvasJQueryElement.width();
    const viewportWidth = this.ViewportService.getWidth() === 0 ? canvasWidth : this.ViewportService.getWidth();
    const canvasBorderWidth = canvasWidth - viewportWidth;
    const targetShift = Math.min(canvasBorderWidth, this.pushWidth) / 2;

    this.iframeJQueryElement.toggleClass('translate-animated', animate);
    this.iframeJQueryElement.css('transform', `translateX(${targetShift}px)`);

    return [canvasWidth, viewportWidth];
  }

  /**
   * Update the scale factor, if necessary
   *
   * We compute the new scale factor and compare it to the old one. In case of a change, we zoom the "elementsToScale",
   * i.e. the iframe and the overlay, in or out. In case the scale factor changes due to opening/closing the sidenav,
   * which is animated by material, we also animate the zooming and do an attempt to keep the scroll position of the
   * iframe unchanged. Other changes (window resize, viewport width change) are not animated and we don't worry much
   * about the scroll position.
   *
   * @param animate  flag indicating that any change should be animated.
   */
  _updateScaling(animate) {
    if (!this.hippoIframeJQueryElement || !this.hippoIframeJQueryElement.is(':visible')) {
      return;
    }

    const [canvasWidth, viewportWidth] = this._updateIframeShift(animate);
    const visibleCanvasWidth = canvasWidth - this.pushWidth;
    const oldScale = this.scaleFactor;
    const newScale = (visibleCanvasWidth < viewportWidth) ? visibleCanvasWidth / viewportWidth : 1;

    if (newScale !== oldScale) {
      const appElementsToScale = this.hippoIframeJQueryElement.find('.cm-scale');
      this._scaleIframe(oldScale, newScale, animate, appElementsToScale);
      this.scaleFactor = newScale;
    }
  }

  _scaleIframe(oldScale, newScale, animate, appElementsToScale) {
    const iframeWindow = this.iframeJQueryElement[0].contentWindow;
    const iframeHtml = $('html', iframeWindow.document);

    const elementsToScale = $.merge(iframeHtml, appElementsToScale);

    const currentOffset = iframeWindow.pageYOffset;
    const targetOffset = oldScale === 1.0 ? newScale * currentOffset : currentOffset / oldScale;
    const scaledScrollOffset = targetOffset - currentOffset;

    this.animating = animate;

    elementsToScale.toggleClass('hippo-animated', animate);

    if (animate) {
      const self = this;
      elementsToScale.one('transitionend', () => {
        self.animating = false;

        // prevent additional callbacks because we change the transform again
        // inside the transitionend callback
        elementsToScale.off('transitionend');

        elementsToScale.removeClass('hippo-animated');
        elementsToScale.css('transform', `scale(${newScale})`);
        iframeWindow.scrollBy(0, scaledScrollOffset);
      });
      elementsToScale.css('transform', `scale(${newScale}) translateY(${-scaledScrollOffset / newScale}px)`);
    } else {
      elementsToScale.css('transform', `scale(${newScale})`);
      iframeWindow.scrollBy(0, scaledScrollOffset);
    }
  }
}

export default ScalingService;
