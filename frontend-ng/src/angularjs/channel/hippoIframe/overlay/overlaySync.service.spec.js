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

describe('OverlaySyncService', () => {
  'use strict';

  let OverlaySyncService;
  let $iframe;
  let $base;
  let $sheet;
  let $scrollX;
  let $overlay;
  let $window;

  beforeEach(() => {
    module('hippo-cm.channel.hippoIframe.overlay');

    inject((_$window_, _OverlaySyncService_, _DomService_) => {
      $window = _$window_;
      OverlaySyncService = _OverlaySyncService_;

      spyOn(_DomService_, 'getScrollBarWidth').and.returnValue(15);
    });

    jasmine.getFixtures().load('channel/hippoIframe/overlay/overlaySync.service.fixture.html');

    $base = $j('.channel-iframe-base');
    $sheet = $j('.channel-iframe-sheet');
    $scrollX = $j('.channel-iframe-scroll-x');
    $iframe = $j('.iframe');
    $overlay = $j('.overlay');
  });

  function loadIframeFixture(callback) {
    OverlaySyncService.init($base, $sheet, $scrollX, $iframe, $overlay);
    $iframe.one('load', () => {
      const iframeWindow = $iframe[0].contentWindow;
      try {
        callback(iframeWindow);
      } catch (e) {
        // Karma silently swallows stack traces for synchronous tests, so log them in an explicit fail
        fail(e);
      }
    });
    $iframe.attr('src', `/${jasmine.getFixtures().fixturesPath}/channel/hippoIframe/overlay/overlaySync.service.iframe.fixture.html`);
  }

  it('should initialize using the default values', (done) => {
    spyOn(OverlaySyncService, '_onLoad');
    loadIframeFixture(() => {
      expect(OverlaySyncService._onLoad).toHaveBeenCalled();
      done();
    });
  });

  it('should not throw errors when sync is called before init', () => {
    expect(() => OverlaySyncService.syncIframe()).not.toThrow();
  });

  it('should attach an unload handler to the iframe', (done) => {
    spyOn(OverlaySyncService, '_onUnLoad');
    loadIframeFixture(() => {
      // load URL again to cause unload
      loadIframeFixture(() => {
        expect(OverlaySyncService._onUnLoad).toHaveBeenCalled();
        done();
      });
    });
  });

  it('should sync on first load', (done) => {
    spyOn(OverlaySyncService, 'syncIframe');
    loadIframeFixture(() => {
      expect(OverlaySyncService.syncIframe).toHaveBeenCalled();
      done();
    });
  });

  it('should attach a MutationObserver on the iframe document on first load', (done) => {
    spyOn(OverlaySyncService.observer, 'observe').and.callThrough();
    loadIframeFixture(iframeWindow => {
      expect(OverlaySyncService.observer.observe).toHaveBeenCalledWith(iframeWindow.document, jasmine.anything());
      done();
    });
  });

  it('should disconnect the MutationObserver on iframe unload', (done) => {
    spyOn(OverlaySyncService.observer, 'disconnect').and.callThrough();
    loadIframeFixture(() => {
      // load URL again to cause unload
      loadIframeFixture(() => {
        expect(OverlaySyncService.observer.disconnect).toHaveBeenCalled();
        done();
      });
    });
  });

  it('should sync when the iframe DOM is changed', (done) => {
    spyOn(OverlaySyncService, 'syncIframe');
    loadIframeFixture(iframeWindow => {
      OverlaySyncService.syncIframe.calls.reset();
      OverlaySyncService.syncIframe.and.callFake(done);
      $(iframeWindow.document.body).css('color', 'green');
    });
  });

  it('should sync when the browser is resized', (done) => {
    spyOn(OverlaySyncService, 'syncIframe');
    loadIframeFixture(() => {
      OverlaySyncService.syncIframe.calls.reset();
      $($window).trigger('resize');
      expect(OverlaySyncService.syncIframe).toHaveBeenCalled();
      done();
    });
  });

  it('should not allow the iframe to show inner scroll bars', (done) => {
    loadIframeFixture((iframeWindow) => {
      const $html = $(iframeWindow.document.documentElement);
      expect($html).toHaveCss({
        overflow: 'hidden',
      });
      done();
    });
  });

  it('should not constrain the viewport by default', (done) => {
    spyOn(OverlaySyncService.observer, 'observe');

    loadIframeFixture((iframeWindow) => {
      const $doc = $(iframeWindow.document.body);
      $doc.width(1200);
      $doc.height(600);
      OverlaySyncService.syncIframe();

      expect($sheet).toHaveCss({
        'max-width': 'none',
      });
      expect($iframe).toHaveCss({
        'min-width': '1280px',
      });

      expect($iframe.height()).toEqual(600);
      expect($overlay.height()).toEqual(600);
      expect($scrollX.height()).toEqual(600);

      done();
    });
  });

  it('should constrain the maximum width to the viewport', (done) => {
    loadIframeFixture(() => {
      OverlaySyncService.setViewPortWidth(720);
      OverlaySyncService.syncIframe();
      expect($sheet.width()).toEqual(720);
      expect($iframe.width()).toEqual(720);
      expect($overlay.width()).toEqual(720);
      done();
    });
  });

  it('should show a horizontal scrollbar when viewport is constrained and site is not responsive', (done) => {
    spyOn(OverlaySyncService.observer, 'observe');
    loadIframeFixture((iframeWindow) => {
      const $doc = $(iframeWindow.document.body);
      $doc.width(1200);
      $doc.height(600);

      OverlaySyncService.setViewPortWidth(720);
      OverlaySyncService.syncIframe();

      expect($iframe.width()).toEqual(1200);
      expect($overlay.width()).toEqual(1200);

      expect($iframe.height()).toEqual(600);
      expect($overlay.height()).toEqual(600);
      expect($scrollX.height()).toEqual(615);
      done();
    });
  });

  it('should be able to (un)register an overlay element', () => {
    spyOn(OverlaySyncService, '_syncElement');
    const element = {};

    OverlaySyncService.registerElement(element);
    expect(OverlaySyncService.overlayElements).toContain(element);

    OverlaySyncService.unregisterElement(element);
    expect(OverlaySyncService.overlayElements).not.toContain(element);
  });

  it('should sync a registered overlay element', (done) => {
    loadIframeFixture(() => {
      const overlayEl = $('<div style="position: absolute"></div>');
      $overlay.append(overlayEl);
      const boxEl = $iframe.contents().find('.container');

      const element = jasmine.createSpyObj('element', ['getOverlayElement', 'getBoxElement']);
      element.getOverlayElement.and.returnValue(overlayEl);
      element.getBoxElement.and.returnValue(boxEl);

      OverlaySyncService.registerElement(element);

      expect(OverlaySyncService.overlayElements).toContain(element);
      expect(overlayEl.width()).toEqual(200);
      expect(overlayEl.height()).toEqual(400);
      expect(overlayEl.offset()).toEqual({ top: 2, left: 4 });

      done();
    });
  });
});
