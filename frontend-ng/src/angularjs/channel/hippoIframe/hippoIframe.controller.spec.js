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

import { EmbeddedLink } from '../page/element/embeddedLink';

describe('hippoIframeCtrl', () => {
  'use strict';

  let PageStructureService;
  let hippoIframeCtrl;
  let scope;
  let $q;
  let $rootScope;
  let ScalingService;
  let DragDropService;
  let OverlaySyncService;
  let hstCommentsProcessorService;
  let PageMetaDataService;
  let ChannelService;
  let CmsService;
  let HippoIframeService;
  let DialogService;
  let DomService;

  beforeEach(() => {
    let $compile;
    module('hippo-cm');

    inject(($controller, _$rootScope_, _$compile_, _$mdDialog_, _$q_, _DragDropService_, _OverlaySyncService_,
            _PageStructureService_, _ScalingService_, _hstCommentsProcessorService_, _PageMetaDataService_,
            _ChannelService_, _CmsService_, _HippoIframeService_, _DialogService_, _DomService_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $q = _$q_;
      DragDropService = _DragDropService_;
      OverlaySyncService = _OverlaySyncService_;
      PageStructureService = _PageStructureService_;
      ScalingService = _ScalingService_;
      hstCommentsProcessorService = _hstCommentsProcessorService_;
      PageMetaDataService = _PageMetaDataService_;
      ChannelService = _ChannelService_;
      CmsService = _CmsService_;
      HippoIframeService = _HippoIframeService_;
      DialogService = _DialogService_;
      DomService = _DomService_;
      scope = $rootScope.$new();
    });

    spyOn(ScalingService, 'init');
    spyOn(DragDropService, 'init');
    spyOn(OverlaySyncService, 'init');

    scope.testEditMode = false;

    const el = angular.element('<hippo-iframe edit-mode="testEditMode"></hippo-iframe>');
    $compile(el)(scope);
    scope.$digest();

    hippoIframeCtrl = el.controller('hippo-iframe');
  });

  it('unsubscribes "delete-component" event when the scope is destroyed', () => {
    spyOn(CmsService, 'unsubscribe');
    scope.$destroy();
    expect(CmsService.unsubscribe).toHaveBeenCalledWith('delete-component', jasmine.any(Function));
  });

  it('shows the confirmation dialog and deletes selected component on confirmation', () => {
    const mockComponent = jasmine.createSpyObj('ComponentElement', ['getLabel']);
    spyOn(DragDropService, 'replaceContainer');
    spyOn(PageStructureService, 'getComponentById').and.returnValue(mockComponent);
    spyOn(PageStructureService, 'removeComponentById').and.returnValue($q.when({ oldContainer: 'old', newContainer: 'new' }));
    spyOn(DialogService, 'show').and.returnValue($q.resolve());
    spyOn(DialogService, 'confirm').and.callThrough();

    hippoIframeCtrl.deleteComponent('1234');

    scope.$digest();

    expect(mockComponent.getLabel).toHaveBeenCalled();
    expect(DialogService.confirm).toHaveBeenCalled();
    expect(DialogService.show).toHaveBeenCalled();
    expect(PageStructureService.removeComponentById).toHaveBeenCalledWith('1234');
    expect(DragDropService.replaceContainer).toHaveBeenCalledWith('old', 'new');
  });

  it('shows component properties dialog after rejecting the delete operation', () => {
    const mockComponent = jasmine.createSpyObj('ComponentElement', ['getLabel']);
    spyOn(PageStructureService, 'getComponentById').and.returnValue(mockComponent);
    spyOn(PageStructureService, 'showComponentProperties');
    spyOn(DialogService, 'show').and.returnValue($q.reject());
    spyOn(DialogService, 'confirm').and.callThrough();

    hippoIframeCtrl.deleteComponent('1234');

    scope.$digest();

    expect(mockComponent.getLabel).toHaveBeenCalled();
    expect(DialogService.confirm).toHaveBeenCalled();
    expect(DialogService.show).toHaveBeenCalled();
    expect(PageStructureService.showComponentProperties).toHaveBeenCalledWith(mockComponent);
  });

  it('switches channels when the channel id in the page meta-data differs from the current channel id', () => {
    const deferred = $q.defer();

    spyOn(PageStructureService, 'clearParsedElements');
    spyOn(hstCommentsProcessorService, 'run');
    spyOn(PageMetaDataService, 'getChannelId').and.returnValue('channelX');
    spyOn(ChannelService, 'getId').and.returnValue('channelY');
    spyOn(ChannelService, 'switchToChannel').and.returnValue(deferred.promise);
    spyOn(hippoIframeCtrl, '_parseLinks');
    spyOn(hippoIframeCtrl, '_updateDragDrop');
    spyOn(HippoIframeService, 'signalPageLoadCompleted');

    hippoIframeCtrl.onLoad();

    expect(PageStructureService.clearParsedElements).toHaveBeenCalled();
    expect(hstCommentsProcessorService.run).toHaveBeenCalled();

    $rootScope.$digest();

    expect(hippoIframeCtrl._updateDragDrop).toHaveBeenCalled();
    expect(PageMetaDataService.getChannelId).toHaveBeenCalled();
    expect(ChannelService.getId).toHaveBeenCalled();
    expect(hippoIframeCtrl._parseLinks).not.toHaveBeenCalled();
    expect(HippoIframeService.signalPageLoadCompleted).not.toHaveBeenCalled();

    deferred.resolve();
    $rootScope.$digest();

    expect(hippoIframeCtrl._parseLinks).toHaveBeenCalled();
    expect(HippoIframeService.signalPageLoadCompleted).toHaveBeenCalled();
  });

  it('inserts CSS and generates content link box elements when there are content links', () => {
    const contentLinkContainer = $j('<div><!-- { "HST-Type": "CONTENT_LINK" --></div>');
    const contentLinkComment = contentLinkContainer[0].childNodes[0];
    const contentLink = new EmbeddedLink(contentLinkComment, {});

    spyOn(PageStructureService, 'clearParsedElements');
    spyOn(PageStructureService, 'hasContentLinks').and.returnValue(true);
    spyOn(PageStructureService, 'getContentLinks').and.returnValue([contentLink]);
    spyOn(hippoIframeCtrl, '_getIframeDOM').and.returnValue({
      defaultView: window,
    });
    spyOn(DomService, 'getAppRootUrl').and.returnValue('http://cms.example.com/app/root/');
    spyOn(DomService, 'addCss').and.returnValue($q.resolve());
    spyOn(hippoIframeCtrl, '_parseLinks');
    spyOn(HippoIframeService, 'signalPageLoadCompleted');

    hippoIframeCtrl.onLoad();

    expect(DomService.addCss).toHaveBeenCalledWith(window, 'http://cms.example.com/app/root/styles/hippo-iframe.css');

    $rootScope.$digest();

    const contentLinkElement = contentLinkContainer.find('a.hst-cmseditlink');
    expect(contentLinkElement.length).toEqual(1);
    expect(contentLink.getBoxElement()).toEqual(contentLinkElement[0]);
  });

  it('sends an "open-content" event to the CMS to open content', () => {
    const contentLinkComment = $j('<!-- { "HST-Type": "CONTENT_LINK" -->')[0];
    const contentLink = new EmbeddedLink(contentLinkComment, {
      uuid: '1234',
    });
    spyOn(CmsService, 'publish');

    hippoIframeCtrl.openContent(contentLink);

    expect(CmsService.publish).toHaveBeenCalledWith('open-content', '1234');
  });
});
