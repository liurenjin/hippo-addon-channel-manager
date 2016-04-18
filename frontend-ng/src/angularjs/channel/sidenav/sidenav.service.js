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

export class ChannelSidenavService {
  constructor($mdSidenav, ScalingService) {
    'ngInject';

    this.$mdSidenav = $mdSidenav;
    this.ScalingService = ScalingService;

    this.id = 'channel-sidenav'; // must match with directive mark-up
  }

  initialize(sidenavJQueryElement) {
    this.sidenavJQueryElement = sidenavJQueryElement;
  }

  toggle() {
    this.$mdSidenav(this.id).toggle();
    this.ScalingService.setPushWidth(this.isOpen() ? this.sidenavJQueryElement.width() : 0);
  }

  isOpen() {
    return this.$mdSidenav(this.id).isOpen();
  }

  close() {
    if (this.isOpen()) {
      this.$mdSidenav(this.id).close();
      this.ScalingService.setPushWidth(0);
    }
  }
}

