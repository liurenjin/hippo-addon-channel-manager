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

describe('ChannelRightSidePanel', () => {
  'use strict';

  let $rootScope;
  let $compile;
  let ChannelSidePanelService;
  let SiteMapService;
  let ChannelService;
  let HippoIframeService;
  let parentScope;
  const catalogComponents = [
    { label: 'dummy' },
  ];

  beforeEach(() => {
    module('hippo-cm');

    inject((_$rootScope_, _$compile_, _ChannelSidePanelService_, _ChannelService_, _SiteMapService_, _HippoIframeService_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      ChannelSidePanelService = _ChannelSidePanelService_;
      ChannelService = _ChannelService_;
      SiteMapService = _SiteMapService_;
      HippoIframeService = _HippoIframeService_;
    });

    spyOn(ChannelService, 'getCatalog').and.returnValue([]);
    spyOn(ChannelSidePanelService, 'initialize');
    spyOn(ChannelSidePanelService, 'close');
    spyOn(SiteMapService, 'get');
    spyOn(HippoIframeService, 'load');
    spyOn(HippoIframeService, 'getCurrentRenderPathInfo');
  });

  function instantiateController(editMode) {
    parentScope = $rootScope.$new();
    parentScope.editMode = editMode;
    const el = angular.element('<channel-right-side-panel edit-mode="editMode"></channel-right-side-panel>');
    $compile(el)(parentScope);
    $rootScope.$digest();
    return el.controller('channel-right-side-panel');
  }

  it('initializes the channel right side panel service upon instantiation', () => {
    instantiateController(false);

    expect(ChannelSidePanelService.initialize).toHaveBeenCalled();
    expect(ChannelSidePanelService.close).toHaveBeenCalled();
  });

  it('retrieves the catalog from the channel service', () => {
    ChannelService.getCatalog.and.returnValue(catalogComponents);
    const ChannelRightSidePanelCtrl = instantiateController();

    expect(ChannelRightSidePanelCtrl.getCatalog()).toBe(catalogComponents);
  });

  it('only shows the components tab in edit mode, and if there are catalog items', () => {
    const ChannelRightSidePanelCtrl = instantiateController(false);
    expect(ChannelRightSidePanelCtrl.showComponentsTab()).toBe(false);

    parentScope.editMode = true;
    $rootScope.$digest();
    expect(ChannelRightSidePanelCtrl.showComponentsTab()).toBe(false);

    ChannelService.getCatalog.and.returnValue(catalogComponents);
    expect(ChannelRightSidePanelCtrl.showComponentsTab()).toBe(true);

    parentScope.editMode = false;
    $rootScope.$digest();
    expect(ChannelRightSidePanelCtrl.showComponentsTab()).toBe(false);
  });

  it('retrieves the sitemap items from the channel siteMap service', () => {
    const siteMapItems = ['dummy'];
    const ChannelRightSidePanelCtrl = instantiateController(false);
    SiteMapService.get.and.returnValue(siteMapItems);

    expect(ChannelRightSidePanelCtrl.getSiteMap()).toBe(siteMapItems);
  });

  it('asks the HippoIframeService to load the requested siteMap item', () => {
    const siteMapItem = {
      renderPathInfo: 'dummy',
    };
    const ChannelRightSidePanelCtrl = instantiateController(false);

    ChannelRightSidePanelCtrl.showPage(siteMapItem);

    expect(HippoIframeService.load).toHaveBeenCalledWith('dummy');
  });

  it('compares the siteMap item\'s renderPathInfo to the current one', () => {
    HippoIframeService.getCurrentRenderPathInfo.and.returnValue('/current/path');
    const siteMapItem = {
      renderPathInfo: '/current/path',
    };
    const ChannelRightSidePanelCtrl = instantiateController(false);
    expect(ChannelRightSidePanelCtrl.isActiveSiteMapItem(siteMapItem)).toBe(true);

    siteMapItem.renderPathInfo = '/other/path';
    expect(ChannelRightSidePanelCtrl.isActiveSiteMapItem(siteMapItem)).toBe(false);
  });
});

