/*
 * Copyright 2015-2016 Hippo B.V. (http://www.onehippo.com)
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

const SIDENAVS = ['components'];

export class ChannelCtrl {

  constructor($log, $mdSidenav, ChannelService) {
    'ngInject';

    this.$log = $log;
    this.$mdSidenav = $mdSidenav;
    this.ChannelService = ChannelService;

    this.iframeUrl = ChannelService.getUrl();
    this.isEditMode = false;
    this.isCreatingPreview = false;
    this.pushWidth = 0; // all sidenavs are closed to start with
  }

  toggleEditMode() {
    if (!this.isEditMode && !this.ChannelService.hasPreviewConfiguration()) {
      this._createPreviewConfiguration();
    } else {
      this.isEditMode = !this.isEditMode;
    }
    this._closeSidenavs();
  }

  _closeSidenavs() {
    SIDENAVS.forEach((sidenav) => {
      if (this._isSidenavOpen(sidenav)) {
        this.$mdSidenav(sidenav).close();
      }
    });
    this._updatePushWidth();
  }

  _createPreviewConfiguration() {
    this.isCreatingPreview = true;
    this.ChannelService.createPreviewConfiguration()
      .then(() => {
        this.isEditMode = true;
      })
      // TODO: handle error response
      .finally(() => {
        this.isCreatingPreview = false;
      });
  }

  toggleSidenav(name) {
    SIDENAVS.forEach((sidenav) => {
      if (sidenav !== name && this._isSidenavOpen(sidenav)) {
        this.$mdSidenav(sidenav).close();
      }
    });
    this.$mdSidenav(name).toggle();
    this._updatePushWidth();
  }

  getCatalog() {
    return this.ChannelService.getCatalog();
  }

  _isSidenavOpen(name) {
    return this.$mdSidenav(name).isOpen();
  }

  _isAnySidenavOpen() {
    return SIDENAVS.some((sidenav) => {
      return this._isSidenavOpen(sidenav);
    });
  }

  _updatePushWidth() {
    this.pushWidth = this._isAnySidenavOpen() ? $('.md-sidenav-left').width() : 0;
  }
}
