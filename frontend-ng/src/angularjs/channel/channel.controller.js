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

export class ChannelCtrl {

  constructor($log, $scope, $translate, $mdSidenav, ChannelService, DialogService, PageMetaDataService, ScalingService, SessionService, ComponentAdderService, ConfigService, HippoIframeService, FeedbackService) {
    'ngInject';

    this.$log = $log;
    this.$scope = $scope;
    this.$translate = $translate;
    this.$mdSidenav = $mdSidenav;
    this.ChannelService = ChannelService;
    this.DialogService = DialogService;
    this.PageMetaDataService = PageMetaDataService;
    this.ScalingService = ScalingService;
    this.SessionService = SessionService;
    this.ConfigService = ConfigService;
    this.HippoIframeService = HippoIframeService;
    this.FeedbackService = FeedbackService;

    this.iframeUrl = ChannelService.getUrl();
    this.isEditMode = false;
    this.isCreatingPreview = false;

    this.viewPorts = [
      {
        name: 'desktop',
        icon: 'computer',
        width: 0,
        titleKey: 'VIEWPORT_WIDTH_DESKTOP',
      },
      {
        name: 'tablet',
        icon: 'tablet',
        width: 720,
        titleKey: 'VIEWPORT_WIDTH_TABLET',
      },
      {
        name: 'phone',
        icon: 'smartphone',
        width: 320,
        titleKey: 'VIEWPORT_WIDTH_PHONE',
      },
    ];

    this.selectViewPort(this.viewPorts[0]);

    // reset service state to avoid weird scaling when controller is reloaded due to state change
    ScalingService.setPushWidth(0);

    ComponentAdderService.setContainerClass('catalog-dd-container');
    ComponentAdderService.setContainerItemClass('catalog-dd-container-item');
  }

  selectViewPort(viewPort) {
    this.selectedViewPort = viewPort;
    this.ScalingService.setViewPortWidth(viewPort.width);
  }

  isViewPortSelected(viewPort) {
    return this.selectedViewPort === viewPort;
  }

  enterEditMode() {
    if (!this.isEditMode && !this.ChannelService.hasPreviewConfiguration()) {
      this._createPreviewConfiguration();
    } else {
      this.isEditMode = true;
    }
  }

  leaveEditMode() {
    this.isEditMode = false;
    if (this.isSidenavOpen()) {
      this.$mdSidenav('sidenav').close();
      this.ScalingService.setPushWidth(0);
    }
  }

  isEditModeActive() {
    return this.isEditMode;
  }

  isEditable() {
    return this.SessionService.hasWriteAccess();
  }

  _createPreviewConfiguration() {
    this.isCreatingPreview = true;
    this.ChannelService.createPreviewConfiguration().then(() => {
      this.HippoIframeService.reload().then(() => {
        this.isEditMode = true;
      })
      .finally(() => {
        this.isCreatingPreview = false;
      });
    }).catch(() => {
      this.isCreatingPreview = false;
      this.FeedbackService.showError('ERROR_ENTER_EDIT');
    });
  }

  showSidenavButton() {
    const catalog = this.ChannelService.getCatalog();
    return this.isEditMode && catalog.length > 0;
  }

  toggleSidenav() {
    this.$mdSidenav('sidenav').toggle();
    this.ScalingService.setPushWidth(this.isSidenavOpen() ? $('.md-sidenav-left').width() : 0);
  }

  getSidenavIcon() {
    return this.isSidenavOpen() ? 'first_page' : 'last_page';
  }

  isSidenavOpen() {
    return this.$mdSidenav('sidenav').isOpen();
  }

  getCatalog() {
    return this.ChannelService.getCatalog();
  }

  getRenderVariant() {
    return this.PageMetaDataService.getRenderVariant();
  }

  hasChanges() {
    return this.ChannelService.getChannel().changedBySet.indexOf(this.ConfigService.cmsUser) !== -1;
  }

  publish() {
    this.ChannelService.publishOwnChanges().then(() => this.HippoIframeService.reload());
    // TODO: what if this fails?
    // show a toast that all went well, or that the publication failed.
    // More information may be exposed by logging an error(?) in the console,
    // based on the actual error details from the back-end.
  }

  discard() {
    this._confirmDiscard().then(() => {
      this.ChannelService.discardOwnChanges().then(() => this.HippoIframeService.reload());
      // TODO: what if this fails?
      // show a toast that discarding the changed failed.
      // More information may be exposed by logging an error(?) in the console,
      // based on the actual error details from the back-end.
    });
  }

  _confirmDiscard() {
    const confirm = this.DialogService.confirm()
      .title(this.$translate.instant('CONFIRM_DISCARD_OWN_CHANGES_TITLE'))
      .textContent(this.$translate.instant('CONFIRM_DISCARD_OWN_CHANGES_MESSAGE'))
      .ok(this.$translate.instant('BUTTON_YES'))
      .cancel(this.$translate.instant('BUTTON_NO'));

    return this.DialogService.show(confirm);
  }
}
