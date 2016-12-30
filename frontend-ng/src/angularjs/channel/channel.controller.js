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

class ChannelCtrl {

  constructor(
      $log,
      $rootScope,
      $translate,
      $stateParams,
      $timeout,
      ChannelService,
      CmsService,
      FeedbackService,
      HippoIframeService,
      PageMetaDataService,
      ScalingService,
      SessionService
    ) {
    'ngInject';

    this.$log = $log;
    this.$rootScope = $rootScope;
    this.$timeout = $timeout;
    this.$translate = $translate;
    this.ChannelService = ChannelService;
    this.FeedbackService = FeedbackService;
    this.HippoIframeService = HippoIframeService;
    this.PageMetaDataService = PageMetaDataService;
    this.ScalingService = ScalingService;
    this.SessionService = SessionService;
    this.isEditMode = false;
    this.isCreatingPreview = false;

    // reset service state to avoid weird scaling when controller is reloaded due to state change
    ScalingService.setPushWidth(0);

    this.HippoIframeService.load($stateParams.initialRenderPath);

    // editToggleState is only used as a 'fake' model for the toggle; isEditMode is updated in the onChange callback,
    // which may happen asynchronously if preview configuration needs to be created.
    this.editToggleState = this.isEditMode = false;

    CmsService.subscribe('clear-channel', () => this._clear());
  }

  _clear() {
    this.$rootScope.$apply(() => {
      this.hideSubpage();
      this.disableEditMode();
      this.ChannelService.clearChannel();
    });
  }

  isControlsDisabled() {
    return this.isCreatingPreview || !this.isChannelLoaded() || !this.isPageLoaded();
  }

  isChannelLoaded() {
    return this.ChannelService.hasChannel();
  }

  isPageLoaded() {
    return this.HippoIframeService.isPageLoaded();
  }

  enableEditMode() {
    if (!this.isEditMode && !this.ChannelService.hasPreviewConfiguration()) {
      this._createPreviewConfiguration();
    } else {
      this.isEditMode = true;
    }
  }

  disableEditMode() {
    this.isEditMode = false;
  }

  isEditable() {
    return this.SessionService.hasWriteAccess();
  }

  editMenu(menuUuid) {
    this.menuUuid = menuUuid;
    this.showSubpage('menu-editor');
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

  getRenderVariant() {
    return this.PageMetaDataService.getRenderVariant();
  }

  isSubpageOpen() {
    return !!this.currentSubpage;
  }

  showSubpage(subpage) {
    this.currentSubpage = subpage;
  }

  hideSubpage() {
    delete this.currentSubpage;
    this.$timeout(() => {
      this.ScalingService.sync();
    }, 0);
  }

  onSubpageSuccess(key, params) {
    this.hideSubpage();
    if (key) {
      // TODO show a toast message notify this change
      this.$log.info(this.$translate.instant(key, params));
    }
  }

  onSubpageError(key, params) {
    this.hideSubpage();
    if (key) {
      this.FeedbackService.showError(key, params);
    }
  }
}

export default ChannelCtrl;
