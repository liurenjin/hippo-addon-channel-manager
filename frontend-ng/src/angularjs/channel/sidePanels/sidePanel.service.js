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

export class ChannelSidePanelService {
  constructor($mdSidenav, ScalingService) {
    'ngInject';

    this.$mdSidenav = $mdSidenav;
    this.ScalingService = ScalingService;
    this.panels = { };
  }

  initialize(side, jQueryElement) {
    const panel = {
      jQueryElement,
      sideNavComponentId: jQueryElement.attr('md-component-id'),
    };

    this.panels[side] = panel;
  }

  toggle(side) {
    this.$mdSidenav(this.panels[side].sideNavComponentId).toggle();

    if (side === 'left') {
      // TODO: Remove this when scaling is fixed
      this.ScalingService.setPushWidth(this.isOpen(side) ? this.panels[side].jQueryElement.width() : 0);
    }
  }

  open(side) {
    if (!this.isOpen(side)) {
      this.$mdSidenav(this.panels[side].sideNavComponentId).open();
    }
  }

  isOpen(side) {
    return this.panels[side] && this.$mdSidenav(this.panels[side].sideNavComponentId).isOpen();
  }

  close(side) {
    if (this.isOpen(side)) {
      this.$mdSidenav(this.panels[side].sideNavComponentId).close();

      if (side === 'left') {
        // TODO: Remove this when scaling is fixed
        this.ScalingService.setPushWidth(0);
      }
    }
  }
}