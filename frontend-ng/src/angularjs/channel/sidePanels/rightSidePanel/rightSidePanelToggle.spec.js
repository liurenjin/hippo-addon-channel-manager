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

/* eslint-disable prefer-const */

describe('ChannelRightSidePanelToggle', () => {
  'use strict';

  let $rootScope;
  let $compile;
  let ChannelSidePanelService;
  let ChannelService;

  beforeEach(() => {
    module('hippo-cm');

    inject((_$rootScope_, _$compile_, _ChannelSidePanelService_, _ChannelService_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      ChannelSidePanelService = _ChannelSidePanelService_;
      ChannelService = _ChannelService_;
    });

    spyOn(ChannelService, 'getCatalog').and.returnValue([]);
    spyOn(ChannelSidePanelService, 'toggle');
    spyOn(ChannelSidePanelService, 'isOpen');
  });

  function instantiateController() {
    const scope = $rootScope.$new();
    const el = angular.element('<channel-right-side-panel-toggle edit-mode="editMode"></channel-right-side-panel-toggle>');
    $compile(el)(scope);
    $rootScope.$digest();
    return el.controller('channel-right-side-panel-toggle');
  }

  it('forwards the toggle call to the right side panel service', () => {
    const ToggleCtrl = instantiateController();
    expect(ChannelSidePanelService.toggle).not.toHaveBeenCalled();

    ToggleCtrl.toggleRightSidePanel();
    expect(ChannelSidePanelService.toggle).toHaveBeenCalled();
  });

  it('forwards the is open call to the right side panel service', () => {
    const ToggleCtrl = instantiateController();
    ChannelSidePanelService.isOpen.and.returnValue(false);
    expect(ToggleCtrl.isRightSidePanelOpen()).toBe(false);
    ChannelSidePanelService.isOpen.and.returnValue(true);
    expect(ToggleCtrl.isRightSidePanelOpen()).toBe(true);
  });
});
