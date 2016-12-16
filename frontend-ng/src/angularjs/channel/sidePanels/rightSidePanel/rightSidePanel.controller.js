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

const ERROR_MAP = {
  UNAVAILABLE: { // default catch-all
    title: 'FEEDBACK_DEFAULT_TITLE',
    linkToFullEditor: true,
    messageKey: 'FEEDBACK_DEFAULT_MESSAGE',
  },
  NOT_A_DOCUMENT: {
    title: 'FEEDBACK_NOT_A_DOCUMENT_TITLE',
    linkToFullEditor: true,
    messageKey: 'FEEDBACK_NOT_A_DOCUMENT_MESSAGE',
  },
  NOT_FOUND: {
    title: 'FEEDBACK_NOT_FOUND_TITLE',
    messageKey: 'FEEDBACK_NOT_FOUND_MESSAGE',
    disableContentButtons: true,
  },
  NO_CONTENT: {
    title: 'FEEDBACK_NOT_EDITABLE_HERE_TITLE',
    messageKey: 'FEEDBACK_NO_EDITABLE_CONTENT_MESSAGE',
    linkToFullEditor: true,
  },
  UNKNOWN_VALIDATOR: {
    title: 'FEEDBACK_CUSTOM_VALIDATION_PRESENT_TITLE',
    linkToFullEditor: true,
    messageKey: 'FEEDBACK_CUSTOM_VALIDATION_PRESENT_MESSAGE',
  },
  OTHER_HOLDER: {
    title: 'FEEDBACK_NOT_EDITABLE_TITLE',
    messageKey: 'FEEDBACK_HELD_BY_OTHER_USER_MESSAGE',
    hasUser: true,
  },
  REQUEST_PENDING: {
    title: 'FEEDBACK_NOT_EDITABLE_TITLE',
    messageKey: 'FEEDBACK_REQUEST_PENDING_MESSAGE',
  },
};

class RightSidePanelCtrl {
  constructor(
    $scope,
    $element,
    $timeout,
    $translate,
    $q,
    ChannelSidePanelService,
    CmsService,
    ContentService,
    DialogService,
    HippoIframeService,
    FeedbackService,
    ) {
    'ngInject';

    this.$scope = $scope;
    this.$element = $element;
    this.$timeout = $timeout;
    this.$translate = $translate;
    this.$q = $q;

    this.ChannelSidePanelService = ChannelSidePanelService;
    this.CmsService = CmsService;
    this.ContentService = ContentService;
    this.DialogService = DialogService;
    this.HippoIframeService = HippoIframeService;
    this.FeedbackService = FeedbackService;

    this.defaultTitle = $translate.instant('EDIT_CONTENT');
    this.closeLabel = $translate.instant('CLOSE');
    this.cancelLabel = $translate.instant('CANCEL');

    ChannelSidePanelService.initialize('right', $element.find('.right-side-panel'), (documentId) => {
      this.openDocument(documentId);
    });
  }

  openDocument(documentId) {
    if (documentId !== this.documentId) {
      this._savePendingChanges(() => {
        this._deleteDraft();
        this._resetState();
        this._loadDocument(documentId);
      });
    }
  }

  _resetState() {
    delete this.doc;
    delete this.documentId;
    delete this.docType;
    delete this.editing;
    delete this.feedback;
    delete this.disableContentButtons;

    this.title = this.defaultTitle;

    this._resetForm();
  }

  _resetForm() {
    if (this.form) {
      this.form.$setPristine();
    }
  }

  _loadDocument(id) {
    this.documentId = id;
    this.loading = true;
    this.ContentService.createDraft(id)
      .then((doc) => {
        if (this._hasFields(doc)) {
          return this.ContentService.getDocumentType(doc.info.type.id)
            .then(docType => this._onLoadSuccess(doc, docType));
        }
        return this.$q.reject(this._noContentResponse(doc));
      })
      .catch(response => this._onLoadFailure(response))
      .finally(() => delete this.loading);
  }

  _hasFields(doc) {
    return doc.fields && Object.keys(doc.fields).length > 0;
  }

  _noContentResponse(doc) {
    return {
      data: {
        reason: 'NO_CONTENT',
        params: {
          displayName: doc.displayName,
        },
      },
    };
  }
  _onLoadSuccess(doc, docType) {
    this.doc = doc;
    this.docType = docType;
    this.editing = true;

    if (this.doc.displayName) {
      this.title = this.$translate.instant('EDIT_DOCUMENT', this.doc);
    }
    this._resizeTextareas();
  }

  _onLoadFailure(response) {
    let errorKey;
    let params = {};

    if (this._isErrorInfo(response.data)) {
      const errorInfo = response.data;
      errorKey = errorInfo.reason;
      if (errorInfo.params) {
        params = this._extractErrorParams(errorInfo);
        if (errorInfo.params.displayName) {
          this.title = this.$translate.instant('EDIT_DOCUMENT', errorInfo.params);
        }
      }
    } else if (response.status === 404) {
      errorKey = 'NOT_FOUND';
    } else {
      errorKey = 'UNAVAILABLE';
    }
    this._handleErrorResponse(errorKey, params);
  }

  _extractErrorParams(errorInfo) {
    const params = {};
    if (errorInfo.reason === 'OTHER_HOLDER') {
      params.user = errorInfo.params.userName || errorInfo.params.userId;
    }
    return params;
  }

  _handleErrorResponse(errorKey, params) {
    const error = ERROR_MAP[errorKey];

    if (error) {
      this.feedback = {
        title: error.title,
        message: this.$translate.instant(error.messageKey, params),
        linkToFullEditor: error.linkToFullEditor,
      };
      this.disableContentButtons = error.disableContentButtons;
    }
  }

  _resizeTextareas() {
    // Set initial size of textareas (see Angular Material issue #9745).
    // Use $timeout to ensure that the sidenav has become visible.
    this.$timeout(() => {
      this.$scope.$broadcast('md-resize-textarea');
    });
  }

  isLockedOpen() {
    return this.ChannelSidePanelService.isOpen('right');
  }

  saveDocument() {
    return this._saveDraft()
      .then((savedDoc) => {
        this.doc = savedDoc;
        this._resetForm();
        this.HippoIframeService.reload();
      })
      .catch((response) => {
        let params = {};
        let errorKey = 'ERROR_UNABLE_TO_SAVE';

        if (this._isErrorInfo(response.data)) {
          errorKey = `ERROR_${response.data.reason}`;
          params = this._extractErrorParams(response.data);
        } else if (this._isDocument(response.data)) {
          errorKey = 'ERROR_INVALID_DATA';
          this._reloadDocumentType();
        }

        this.FeedbackService.showError(errorKey, params, this.$element);

        return this.$q.reject(); // tell the caller that saving has failed.
      });
  }

  _isDocument(obj) {
    return obj && obj.id; // Document has an ID field, ErrorInfo doesn't.
  }

  _isErrorInfo(obj) {
    return obj && obj.reason; // ErrorInfo has a reason field, Document doesn't.
  }

  _reloadDocumentType() {
    this.ContentService.getDocumentType(this.doc.info.type.id)
      .then((docType) => {
        this.docType = docType;
      })
      .catch((response) => {
        this._onLoadFailure(response);
      });
  }

  openFullContent(mode) {
    this._savePendingChanges(() => {
      if (mode === 'view') {
        this._deleteDraft();
      }
      this._closePanelAndOpenContent(mode);
    });
  }

  _savePendingChanges(done) {
    this._confirmSaveChanges()
      .then(() => {
        // don't return the result of saveDocument so a failing save does not invoke the 'done' function
        this.saveDocument().then(done);
      })
      .catch(done);
  }

  _confirmSaveChanges() {
    if (!this._isFormDirty()) {
      return this.$q.reject();
    }
    const messageParams = {
      documentName: this.doc.displayName,
    };
    const confirm = this.DialogService.confirm()
      .textContent(this.$translate.instant('CONFIRM_SAVE_CHANGES_MESSAGE', messageParams))
      .ok(this.$translate.instant('SAVE'))
      .cancel(this.$translate.instant('DISCARD'));

    return this.DialogService.show(confirm);
  }

  _closePanelAndOpenContent(mode) {
    // The CMS automatically unlocks content that is being viewed, so close the side-panel to reflect that.
    // It will will unlock the document if needed, so don't delete the draft here.
    this._closePanel();

    // mode can be 'view' or 'edit', so the event names can be 'view-content' and 'edit-content'
    this.CmsService.publish('open-content', this.documentId, mode);
  }

  _saveDraft() {
    if (!this._isFormDirty()) {
      return this.$q.resolve();
    }
    return this.ContentService.saveDraft(this.doc);
  }

  closeButtonLabel() {
    return this._isFormDirty() ? this.cancelLabel : this.closeLabel;
  }

  _isFormDirty() {
    return this.form && this.form.$dirty;
  }

  close() {
    this._confirmDiscardChanges().then(() => {
      this._deleteDraft();
      this._closePanel();
    });
  }

  _confirmDiscardChanges() {
    if (!this._isFormDirty()) {
      return this.$q.resolve();
    }
    const messageParams = {
      documentName: this.doc.displayName,
    };
    const confirm = this.DialogService.confirm()
      .textContent(this.$translate.instant('CONFIRM_DISCARD_UNSAVED_CHANGES_MESSAGE', messageParams))
      .ok(this.$translate.instant('DISCARD'))
      .cancel(this.cancelLabel);

    return this.DialogService.show(confirm);
  }

  _deleteDraft() {
    if (this.editing) {
      this.ContentService.deleteDraft(this.documentId);
    }
  }

  _closePanel() {
    this.ChannelSidePanelService.close('right')
      .then(() => this._resetState());
  }
}

export default RightSidePanelCtrl;
