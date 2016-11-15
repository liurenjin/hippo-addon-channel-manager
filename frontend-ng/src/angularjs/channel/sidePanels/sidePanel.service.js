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

class ChannelSidePanelService {
  constructor($mdSidenav, OverlaySyncService) {
    'ngInject';

    this.$mdSidenav = $mdSidenav;
    this.OverlaySyncService = OverlaySyncService;
    this.panels = { };
  }

  initialize(side, jQueryElement, onOpenCallback) {
    const panel = {
      jQueryElement,
      sideNavComponentId: jQueryElement.attr('md-component-id'),
      onOpenCallback: onOpenCallback || angular.noop,
    };

    this.panels[side] = panel;
  }

  toggle(side) {
    if (this.isOpen(side)) {
      this.close(side);
    } else {
      this.open(side);
    }
  }

  open(side, ...params) {
    const panel = this.panels[side];
    if (panel) {
      if (!this.isOpen(side)) {
        this.$mdSidenav(panel.sideNavComponentId).open().then(() => {
          this.OverlaySyncService.syncIframe();
        });
      }
      panel.onOpenCallback(...params);
    }
  }

  isOpen(side) {
    const panel = this.panels[side];
    return panel && this.$mdSidenav(panel.sideNavComponentId).isOpen();
  }

  close(side) {
    if (this.isOpen(side)) {
      const panel = this.panels[side];
      this.$mdSidenav(panel.sideNavComponentId).close().then(() => {
        this.OverlaySyncService.syncIframe();
      });
    }
  }
}

export default ChannelSidePanelService;