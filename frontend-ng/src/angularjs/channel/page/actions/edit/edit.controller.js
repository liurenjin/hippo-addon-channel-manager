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

export class PageEditCtrl {
  constructor($translate, $mdDialog, SiteMapService, SiteMapItemService, ChannelService, HippoIframeService,
              FeedbackService) {
    'ngInject';

    this.$translate = $translate;
    this.$mdDialog = $mdDialog;
    this.SiteMapService = SiteMapService;
    this.SiteMapItemService = SiteMapItemService;
    this.ChannelService = ChannelService;
    this.HippoIframeService = HippoIframeService;
    this.FeedbackService = FeedbackService;

    const documentNone = {
      displayName: $translate.instant('SUBPAGE_PAGE_EDIT_PRIMARY_DOCUMENT_VALUE_NONE'),
      path: '',
    };

    // The PageActionsCtrl has retrieved the page meta-data when opening the page menu.
    // Now, it is available through the SiteMapItemService.
    this.item = SiteMapItemService.get();
    this.isEditable = SiteMapItemService.isEditable();

    this.subpageTitle = $translate.instant('SUBPAGE_PAGE_EDIT_TITLE', { pageName: this.item.name });
    this.title = this.item.pageTitle;
    this.availableDocuments = this.item.availableDocumentRepresentations || [];
    this.availableDocuments.unshift(documentNone);
    const currentPrimaryDocumentPath = this.item.primaryDocumentRepresentation
                                     ? this.item.primaryDocumentRepresentation.path : '';
    this.primaryDocument = this.availableDocuments.find((dr) => dr.path === currentPrimaryDocumentPath) || documentNone;
    this.prototypes = [];

    this.ChannelService.getNewPageModel()
      .then((data) => {
        this.prototypes = data.prototypes;
      })
      .catch(() => {
        this.FeedbackService.showErrorOnSubpage('ERROR_PAGE_MODEL_RETRIEVAL_FAILED');
      });
  }

  save() {
    const item = {
      id: this.item.id,
      parentId: this.item.parentId,
      name: this.item.name,
      pageTitle: this.title,
      primaryDocumentRepresentation: this.primaryDocument,
    };

    if (this.isAssigningNewTemplate && this.prototype) {
      item.componentConfigurationId = this.prototype.id;
    }

    const siteMapId = this.ChannelService.getSiteMapId();
    this.SiteMapItemService.updateItem(item, siteMapId)
      .then(() => {
        this.HippoIframeService.reload();
        this.SiteMapService.load(siteMapId);
        this.ChannelService.recordOwnChange();
        this.onDone();
      })
      .catch((response) => {
        // response might be undefined or null (for example when the network connection is lost)
        response = response || {};

        let messageKey;
        switch (response.errorCode) {
          case 'ITEM_ALREADY_LOCKED':
            messageKey = 'ERROR_PAGE_LOCKED_BY';
            break;
          default:
            messageKey = 'ERROR_PAGE_SAVE_FAILED';
            break;
        }

        this.FeedbackService.showErrorOnSubpage(messageKey, response.data);
      });
  }

  hasPrototypes() {
    return this.prototypes && this.prototypes.length > 0;
  }

  evaluatePrototype() {
    if (this.isAssigningNewTemplate && this.item.hasContainerItemInPageDefinition) {
      let textContent;
      if (this.prototype.hasContainerInPageDefinition) {
        textContent = this.$translate.instant('SUBPAGE_PAGE_EDIT_ALERT_CONTENT_REPOSITIONING');
      } else {
        textContent = this.$translate.instant('SUBPAGE_PAGE_EDIT_ALERT_CONTENT_REMOVAL');
      }
      this.$mdDialog.show(
        this.$mdDialog.alert()
          .clickOutsideToClose(true)
          .textContent(textContent)
          .ok(this.$translate.instant('ALERT_OK'))
      );
    }
  }
}

