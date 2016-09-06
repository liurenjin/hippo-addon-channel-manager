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

export class ChannelRightSidePanelCtrl {
  constructor($scope, $element, ChannelSidePanelService, ChannelService, SiteMapService, HippoIframeService) {
    'ngInject';

    this.$scope = $scope;
    this.ChannelService = ChannelService;
    this.ChannelSidePanelService = ChannelSidePanelService;
    this.SiteMapService = SiteMapService;
    this.HippoIframeService = HippoIframeService;

    ChannelSidePanelService.initialize('right', $element.find('.channel-right-side-panel'));
    this.closePanelOnEditModeTurnedOff();
  }

  closePanelOnEditModeTurnedOff() {
    this.$scope.$watch('$ctrl.editMode', () => {
      if (!this.editMode) {
        this.ChannelSidePanelService.close('right');
      }
    });
  }

  showComponentsTab() {
    const catalog = this.getCatalog();
    return this.editMode && catalog.length > 0;
  }

  getCatalog() {
    return this.ChannelService.getCatalog();
  }

  getSiteMap() {
    return this.SiteMapService.get();
  }

  showPage(siteMapItem) {
    this.HippoIframeService.load(siteMapItem.renderPathInfo);
  }

  isActiveSiteMapItem(siteMapItem) {
    return siteMapItem.renderPathInfo === this.HippoIframeService.getCurrentRenderPathInfo();
  }
}

const channelRightSidePanelComponentModule = angular
  .module('hippo-cm.channel.rightSidePanelComponentModule', [])
  .component('channelRightSidePanel', {
    bindings: {
      editMode: '=',
    },
    controller: ChannelRightSidePanelCtrl,
    templateUrl: 'channel/sidePanels/rightSidePanel/rightSidePanel.html',
  });

export default channelRightSidePanelComponentModule;
