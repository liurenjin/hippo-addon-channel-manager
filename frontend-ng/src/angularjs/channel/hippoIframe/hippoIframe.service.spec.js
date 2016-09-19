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

import angular from 'angular';
import 'angular-mocks';

describe('HippoIframeService', () => {
  'use strict';

  let $log;
  let $rootScope;
  let iframe;
  let HippoIframeService;
  let ChannelService;
  const iframeSrc = `/${jasmine.getFixtures().fixturesPath}/channel/hippoIframe/hippoIframe.service.iframe.fixture.html`;

  beforeEach(() => {
    angular.mock.module('hippo-cm');

    inject((_$log_, _$rootScope_, _HippoIframeService_, _ChannelService_) => {
      $log = _$log_;
      $rootScope = _$rootScope_;
      HippoIframeService = _HippoIframeService_;
      ChannelService = _ChannelService_;
    });

    spyOn(ChannelService, 'makePath').and.returnValue('/test/url');
    spyOn(ChannelService, 'extractRenderPathInfo');

    jasmine.getFixtures().load('channel/hippoIframe/hippoIframe.service.fixture.html');

    iframe = $j('#testIframe');
    HippoIframeService.initialize(iframe);
  });

  function loadIframeFixture(callback) {
    iframe.one('load', () => {
      try {
        callback();
      } catch (e) {
        fail(e);
      }
    });
    iframe.attr('src', iframeSrc);
  }

  it('does not reload the iframe when no page has been loaded yet', (done) => {
    HippoIframeService.initialize(undefined); // undo initialization

    HippoIframeService.reload().then(() => {
      expect(HippoIframeService.deferredReload).toBeFalsy();
      done();
    });

    $rootScope.$digest();
  });

  it('reloads the iframe and waits for the page load to complete', (done) => {
    loadIframeFixture(() => { // give the iframe something to reload.
      HippoIframeService.pageLoaded = true;
      spyOn($log, 'warn');

      iframe.one('load', () => { // catch the reload event to signal page load completion
        expect(HippoIframeService.deferredReload).toBeTruthy();
        HippoIframeService.signalPageLoadCompleted();

        $rootScope.$digest();
      });

      HippoIframeService.reload().then(() => { // trigger the reload, wait for its completion
        expect(HippoIframeService.deferredReload).toBeFalsy();
        expect($log.warn).not.toHaveBeenCalled();
        done();
      });
    });
  });

  it('reloads the iframe when a "reload-page" event is received', () => {
    spyOn(HippoIframeService, 'reload');
    window.CMS_TO_APP.publish('reload-page');
    expect(HippoIframeService.reload).toHaveBeenCalled();
  });


  it('logs a warning upon a reload request when a reload is already ongoing', (done) => {
    spyOn($log, 'warn');

    HippoIframeService.pageLoaded = true;
    const initialPromise = HippoIframeService.reload();

    expect($log.warn).not.toHaveBeenCalled();

    const subsequentPromise = HippoIframeService.reload();

    expect($log.warn).toHaveBeenCalled();
    expect(subsequentPromise).toBe(initialPromise);

    initialPromise.then(() => {
      done();
    });

    HippoIframeService.signalPageLoadCompleted();

    $rootScope.$digest();
  });

  it('ignores page loads which are no reloads', () => {
    spyOn($log, 'warn');

    HippoIframeService.signalPageLoadCompleted();

    expect($log.warn).not.toHaveBeenCalled();
  });

  it('loads the requested renderPathInfo', () => {
    ChannelService.makePath.and.returnValue('fullPath');
    HippoIframeService.load('dummy');
    expect(ChannelService.makePath).toHaveBeenCalledWith('dummy');
    expect(HippoIframeService.getSrc()).toBe('fullPath');
  });

  it('extracts the current renderPathInfo when the page has been loaded', () => {
    ChannelService.extractRenderPathInfo.and.returnValue('dummy');
    HippoIframeService.signalPageLoadCompleted();
    expect(HippoIframeService.getCurrentRenderPathInfo()).toBe('dummy');
  });

  it('triggers a reload when trying to load the current page', (done) => {
    ChannelService.extractRenderPathInfo.and.returnValue('/target');
    ChannelService.makePath.and.returnValue(iframeSrc);
    spyOn(HippoIframeService, 'reload');
    loadIframeFixture(() => { // give the iframe something to reload.
      HippoIframeService.signalPageLoadCompleted();
      HippoIframeService.load('dummy');
      expect(HippoIframeService.reload).toHaveBeenCalled();
      done();
    });
  });

  it('uses jQuery to trigger a reload if the src attribute matches the to-be-loaded path', () => {
    ChannelService.extractRenderPathInfo.and.returnValue('/target');
    HippoIframeService.load('/target');
    HippoIframeService.signalPageLoadCompleted();

    spyOn(iframe, 'attr');
    HippoIframeService.load('/not/target');
    expect(iframe.attr).toHaveBeenCalledWith('src', '/test/url');
  });
});
