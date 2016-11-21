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

import debounce from 'lodash.debounce';
import MutationSummary from 'mutation-summary';

export class OverlaySyncService {

  constructor($rootScope, $window, DomService) {
    'ngInject';

    this.$rootScope = $rootScope;
    this.$window = $window;
    this.DomService = DomService;

    this.overlayElements = [];

    this.syncIframeDebounced = debounce(() => this.syncIframe(), 250, {
      maxWait: 1000,
      leading: true,
      trailing: true,
    });

    this.viewPortWidth = 0;
  }

  init($base, $sheet, $scrollX, $iframe, $overlay) {
    this.$base = $base;
    this.$sheet = $sheet;
    this.$scrollX = $scrollX;
    this.$iframe = $iframe;
    this.$overlay = $overlay;

    this.$iframe.on('load', () => this._onLoad());
  }

  registerElement(structureElement) {
    this.overlayElements.push(structureElement);
    this._syncElement(structureElement);
  }

  unregisterElement(structureElement) {
    const index = this.overlayElements.indexOf(structureElement);
    if (index > -1) {
      this.overlayElements.splice(index, 1);
    }
  }

  _onLoad() {
    this._setHeight(0);
    this.syncIframe();

    const iframeWindow = this._getIframeWindow();
    this.observer = new MutationSummary({
      callback: () => this.onDOMChanged(),
      rootNode: iframeWindow.document,
      observeOwnChanges: true,
      queries: [{ all: true }],
    });

    $(iframeWindow).on('unload', () => this._onUnLoad());
    $(this.$window).on('resize.overlaysync', () => this.syncIframe());
  }

  _onUnLoad() {
    this.$rootScope.$apply(() => {
      this.overlayElements = [];
      this.observer.disconnect();
      $(this.$window).off('.overlaysync');
    });
  }

  onDOMChanged() {
    this.syncIframeDebounced();
  }

  syncIframe() {
    this._syncDimensions();
    this._syncOverlayElements();
  }

  setViewPortWidth(viewPortWidth) {
    this.viewPortWidth = viewPortWidth;
  }

  getViewPortWidth() {
    return this.viewPortWidth;
  }

  _syncDimensions() {
    if (this.$iframe && this.$overlay) {
      const doc = this._getIframeWindow().document;

      if (doc) {
        const isHorizontalScrollBarVisible = this._syncWidth(doc);
        const height = this._getIframeHeight(doc);
        this._setHeight(height, isHorizontalScrollBarVisible);
      }
    }
  }

  /**
   * Sync the width of the iframe and overlay. The width can be constrained by the viewPortWidth.
   *
   * @param iframeDocument The document object of the rendered channel in the iframe.
   * @returns {boolean} true when the site in the iframe is wider than the viewport
   * @private
   */
  _syncWidth(iframeDocument) {
    // reset min-width on iframe
    this.$iframe.css('min-width', '0');

    if (this.viewPortWidth === 0) {
      // Desktop mode - no width constraints
      this.$sheet.css('max-width', 'none');
      this.$iframe.width('');
      this.$overlay.width('');
    } else {
      // viewport is constrained
      const width = `${this.viewPortWidth}px`;
      this.$sheet.css('max-width', width);
      this.$iframe.width(width);

      const iframeDocumentWidth = $(iframeDocument).width();
      if (iframeDocumentWidth <= this.viewPortWidth) {
        this.$overlay.width(width);
      } else {
        // site has min-width bigger than viewport, so it needs a horizontal scrollbar
        this.$iframe.width(iframeDocumentWidth);
        this.$iframe.css('min-width', `${iframeDocumentWidth}px`);
        this.$overlay.width(iframeDocumentWidth);
        return true;
      }
    }
    return false;
  }

  _getIframeHeight(doc) {
    const heightMarker = $('.hippo-channel-manager-page-height-marker', doc);
    if (heightMarker.length > 0) {
      return this.DomService.getBottom(heightMarker[0]);
    }
    return this.DomService.getLowestElementBottom(doc);
  }

  _setHeight(height, isHorizontalScrollBarVisible) {
    this.$sheet.height(height);
    this.$iframe.height(height);
    this.$overlay.height(height);

    // setting the absolute height on scrollX ensures that the scroll-position will be maintained when scaling
    const scrollHeight = height + (isHorizontalScrollBarVisible ? this.DomService.getScrollBarWidth() : 0);
    this.$scrollX.height(scrollHeight);
  }

  _syncOverlayElements() {
    this.overlayElements.forEach((element) => this._syncElement(element));
  }

  _syncElement(structureElement) {
    const overlayJQueryElement = structureElement.getOverlayElement();
    const iframeJQueryElement = structureElement.getBoxElement();

    const rect = iframeJQueryElement[0].getBoundingClientRect();

    overlayJQueryElement.css('top', `${rect.top}px`);
    overlayJQueryElement.css('left', `${rect.left}px`);
    overlayJQueryElement.css('height', `${rect.height}px`);
    overlayJQueryElement.css('width', `${rect.width}px`);
  }

  _getIframeWindow() {
    return this.$iframe[0].contentWindow;
  }

}
