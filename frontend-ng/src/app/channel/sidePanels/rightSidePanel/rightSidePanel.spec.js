/*
 * Copyright 2016-2017 Hippo B.V. (http://www.onehippo.com)
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

describe('RightSidePanel', () => {
  let $componentController;
  let $q;
  let $rootScope;
  let $timeout;
  let $translate;
  let SidePanelService;
  let CmsService;
  let ContentService;
  let DialogService;
  let HippoIframeService;
  let FeedbackService;
  let ChannelService;

  let $ctrl;
  let $scope;
  let dialog;
  let sidePanelHandlers;

  const stringField = {
    id: 'ns:string',
    type: 'STRING',
  };
  const multipleStringField = {
    id: 'ns:multiplestring',
    type: 'STRING',
    multiple: true,
  };
  const emptyMultipleStringField = {
    id: 'ns:emptymultiplestring',
    type: 'STRING',
    multiple: true,
  };
  const testDocumentType = {
    id: 'ns:testdocument',
    fields: [
      stringField,
      multipleStringField,
      emptyMultipleStringField,
    ],
  };
  const testDocument = {
    id: 'test',
    info: {
      type: {
        id: 'ns:testdocument',
      },
    },
    fields: {
      'ns:string': [
        {
          value: 'String value',
        },
      ],
      'ns:multiplestring': [
        {
          value: 'One',
        },
        {
          value: 'Two',
        },
      ],
      'ns:emptymultiplestring': [],
    },
  };

  beforeEach(() => {
    angular.mock.module('hippo-cm');

    inject((_$componentController_, _$q_, _$rootScope_, _$timeout_, _$translate_, _ChannelService_) => {
      $componentController = _$componentController_;
      $q = _$q_;
      $rootScope = _$rootScope_;
      $timeout = _$timeout_;
      $translate = _$translate_;
      ChannelService = _ChannelService_;
    });

    SidePanelService = jasmine.createSpyObj('SidePanelService', ['initialize', 'isOpen', 'close']);
    ContentService = jasmine.createSpyObj('ContentService', ['createDraft', 'getDocumentType', 'saveDraft', 'deleteDraft']);
    FeedbackService = jasmine.createSpyObj('FeedbackService', ['showError']);

    CmsService = jasmine.createSpyObj('CmsService', ['closeDocumentWhenValid', 'publish', 'reportUsageStatistic', 'subscribe']);
    DialogService = jasmine.createSpyObj('DialogService', ['confirm', 'show']);
    HippoIframeService = jasmine.createSpyObj('HippoIframeService', ['reload']);

    dialog = jasmine.createSpyObj('dialog', ['textContent', 'ok', 'cancel']);
    dialog.textContent.and.returnValue(dialog);
    dialog.ok.and.returnValue(dialog);
    dialog.cancel.and.returnValue(dialog);
    DialogService.confirm.and.returnValue(dialog);

    spyOn($translate, 'instant').and.callThrough();

    $scope = $rootScope.$new();
    const $element = angular.element('<div></div>');
    $ctrl = $componentController('rightSidePanel', {
      $scope,
      $element,
      $timeout,
      SidePanelService,
      CmsService,
      ContentService,
      DialogService,
      HippoIframeService,
      FeedbackService,
    });
    $ctrl.form = jasmine.createSpyObj('form', ['$setPristine']);
    $rootScope.$apply();

    sidePanelHandlers = {
      onOpen: SidePanelService.initialize.calls.mostRecent().args[2],
      onClose: SidePanelService.initialize.calls.mostRecent().args[3],
    };
  });

  it('should set full width mode on and off', () => {
    $ctrl.setFullWidth(true);
    expect($ctrl.$element.hasClass('fullwidth')).toBe(true);
    expect($ctrl.isFullWidth).toBe(true);
    expect(CmsService.reportUsageStatistic).toHaveBeenCalledWith('CMSChannelsFullScreen');

    CmsService.reportUsageStatistic.calls.reset();

    $ctrl.setFullWidth(false);
    expect($ctrl.$element.hasClass('fullwidth')).toBe(false);
    expect($ctrl.isFullWidth).toBe(false);
    expect(CmsService.reportUsageStatistic).not.toHaveBeenCalled();
  });

  it('should update local storage on resize', () => {
    $ctrl.onResize(800);

    expect($ctrl.lastSavedWidth).toBe('800px');
    expect($ctrl.localStorageService.get('rightSidePanelWidth')).toBe('800px');
  });

  it('should detect ESC keypress', () => {
    const e = angular.element.Event('keydown');
    e.which = 27;

    spyOn($ctrl, 'close');
    $ctrl.$element.trigger(e);
    expect($ctrl.close).toHaveBeenCalled();
  });

  it('should load last saved width of right side panel', () => {
    spyOn($ctrl.localStorageService, 'get').and.callFake(() => '800px');

    $ctrl.$onInit();

    expect($ctrl.localStorageService.get).toHaveBeenCalledWith('rightSidePanelWidth');
    expect($ctrl.lastSavedWidth).toBe('800px');

    $ctrl.localStorageService.get.and.callFake(() => null);

    $ctrl.$onInit();

    expect($ctrl.localStorageService.get).toHaveBeenCalledWith('rightSidePanelWidth');
    expect($ctrl.lastSavedWidth).toBe('440px');
  });

  it('initializes the channel right side panel service upon instantiation', () => {
    expect(SidePanelService.initialize).toHaveBeenCalled();
    expect($ctrl.doc).not.toBeDefined();
    expect($ctrl.docType).not.toBeDefined();
    expect($ctrl.isDocumentDirty()).toBeFalsy();
  });

  it('knows when it is locked open', () => {
    SidePanelService.isOpen.and.returnValue(true);
    expect($ctrl.isLockedOpen()).toBe(true);
  });

  it('knows when it is not locked open', () => {
    SidePanelService.isOpen.and.returnValue(false);
    expect($ctrl.isLockedOpen()).toBe(false);
  });

  it('shows the correct close button label', () => {
    $ctrl.closeLabel = 'Close';
    $ctrl.cancelLabel = 'Cancel';
    expect($ctrl.closeButtonLabel()).toBe('Close');

    $ctrl.form.$dirty = true;
    expect($ctrl.closeButtonLabel()).toBe('Cancel');

    $ctrl.form.$dirty = false;
    expect($ctrl.closeButtonLabel()).toBe('Close');

    delete $ctrl.form;
    expect($ctrl.closeButtonLabel()).toBe('Close');
  });

  it('knows the document is dirty when the backend says so', () => {
    $ctrl.doc = {
      info: {
        dirty: true,
      },
    };
    expect($ctrl.isDocumentDirty()).toBe(true);
  });

  it('knows the document is dirty when the form is dirty', () => {
    $ctrl.form.$dirty = true;
    expect($ctrl.isDocumentDirty()).toBe(true);
  });

  it('knows the document is dirty when both the backend says so and the form is dirty', () => {
    $ctrl.doc = {
      info: {
        dirty: true,
      },
    };
    $ctrl.form.$dirty = true;
    expect($ctrl.isDocumentDirty()).toBe(true);
  });

  it('closes the panel', () => {
    SidePanelService.close.and.returnValue($q.resolve());
    $ctrl.close();
    $rootScope.$digest();
    expect(ContentService.deleteDraft).not.toHaveBeenCalled();
    expect(SidePanelService.close).toHaveBeenCalledWith('right');

    $ctrl.documentId = 'test';
    $ctrl.editing = true;
    $ctrl.close();
    $rootScope.$digest();
    expect(ContentService.deleteDraft).toHaveBeenCalledWith('test');
    expect(SidePanelService.close).toHaveBeenCalledWith('right');
    expect($ctrl.doc).toBeUndefined();
    expect($ctrl.documentId).toBeUndefined();
    expect($ctrl.docType).toBeUndefined();
    expect($ctrl.editing).toBeUndefined();
    expect($ctrl.feedback).toBeUndefined();
    expect($ctrl.disableContentButtons).toBeUndefined();
    expect($ctrl.title).toBe($ctrl.defaultTitle);
    expect($ctrl.form.$setPristine).toHaveBeenCalled();
  });

  it('asks for confirmation when cancelling changes', () => {
    DialogService.show.and.returnValue($q.resolve());

    const deferClose = $q.defer();
    SidePanelService.close.and.returnValue(deferClose.promise);

    $ctrl.doc = {
      displayName: 'test',
    };
    $ctrl.documentId = 'test';
    $ctrl.form.$dirty = true;
    $ctrl.editing = true;

    $ctrl.close();
    $rootScope.$digest();

    expect($ctrl.deleteDraftOnClose).toBe(false);
    expect(ContentService.deleteDraft).toHaveBeenCalledWith('test');
    expect(SidePanelService.close).toHaveBeenCalledWith('right');

    deferClose.resolve();
    $rootScope.$digest();

    expect($translate.instant).toHaveBeenCalledWith('CONFIRM_DISCARD_UNSAVED_CHANGES_MESSAGE', {
      documentName: 'test',
    });
    expect($ctrl.editing).toBeFalsy();
    expect($ctrl.deleteDraftOnClose).toBe(true);
  });

  it('asks doesn\'t delete and close if discarding is not confirmed', () => {
    DialogService.show.and.returnValue($q.reject());
    $ctrl.doc = {};
    $ctrl.documentId = 'test';
    $ctrl.form.$dirty = true;
    $ctrl.close();
    $rootScope.$digest();

    expect(ContentService.deleteDraft).not.toHaveBeenCalled();
    expect(SidePanelService.close).not.toHaveBeenCalled();
  });

  it('opens a document', () => {
    testDocument.displayName = 'Display Name';
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.resolve(testDocument));
    ContentService.getDocumentType.and.returnValue($q.resolve(testDocumentType));
    spyOn($scope, '$broadcast');

    spyOn($ctrl, '_confirmSaveOrDiscardChanges').and.returnValue($q.resolve());

    sidePanelHandlers.onOpen('test');
    sidePanelHandlers.onClose();
    $rootScope.$digest();

    expect($ctrl._confirmSaveOrDiscardChanges).toHaveBeenCalled();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).toHaveBeenCalledWith('ns:testdocument');

    expect($ctrl.doc).toEqual(testDocument);
    expect($ctrl.docType).toEqual(testDocumentType);
    expect($ctrl.form.$setPristine).toHaveBeenCalled();
    expect($translate.instant).toHaveBeenCalledWith('EDIT_DOCUMENT', testDocument);

    $timeout.flush();
    expect($scope.$broadcast).toHaveBeenCalledWith('md-resize-textarea');
    delete testDocument.displayName;
  });

  it('opens a document with no display name', () => {
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.resolve(testDocument));
    ContentService.getDocumentType.and.returnValue($q.resolve(testDocumentType));
    spyOn($scope, '$broadcast');

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).toHaveBeenCalledWith('ns:testdocument');

    expect($ctrl.doc).toEqual(testDocument);
    expect($ctrl.docType).toEqual(testDocumentType);
    expect($ctrl.form.$setPristine).toHaveBeenCalled();
    expect($translate.instant).not.toHaveBeenCalledWith('EDIT_DOCUMENT', testDocument);

    $timeout.flush();
    expect($scope.$broadcast).toHaveBeenCalledWith('md-resize-textarea');
  });

  it('opens a document without content', () => {
    const emptyDocument = {
      id: 'test',
      displayName: 'Display Name',
      info: {
        type: { id: 'ns:testdocument' },
      },
      fields: { },
    };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.resolve(emptyDocument));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');

    expect($ctrl.doc).toBeUndefined();
    expect($ctrl.docType).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('EDIT_DOCUMENT', { displayName: 'Display Name' });
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_NO_EDITABLE_CONTENT_MESSAGE', { });
  });

  it('ignores a non-existing form when opening a document', () => {
    ContentService.createDraft.and.returnValue($q.resolve(testDocument));
    ContentService.getDocumentType.and.returnValue($q.resolve(testDocumentType));
    delete $ctrl.form;

    expect(() => {
      sidePanelHandlers.onOpen('test');
      $rootScope.$digest();
    }).not.toThrow();
  });

  it('knows that a document is loading', () => {
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());

    const deferredDraft = $q.defer();
    ContentService.createDraft.and.returnValue(deferredDraft.promise);

    const deferredDocType = $q.defer();
    ContentService.getDocumentType.and.returnValue(deferredDocType.promise);

    $ctrl._loadDocument('test');
    expect($ctrl.loading).toBeTruthy();

    $rootScope.$digest();
    expect($ctrl.loading).toBeTruthy();

    deferredDraft.resolve(testDocument);
    $rootScope.$digest();
    expect($ctrl.loading).toBeTruthy();

    deferredDocType.resolve(testDocumentType);
    $rootScope.$digest();
    expect($ctrl.loading).toBeFalsy();
  });

  describe('with an existing document', () => {
    const newDocument = {
      id: 'newdoc',
      info: {
        type: {
          id: 'ns:newdoctype',
        },
      },
      fields: {
        dummy: 'value',
      },
    };
    const newDocumentType = {
      id: 'ns:newdoctype',
      fields: [
        {
          id: 'dummy',
        },
      ],
    };

    beforeEach(() => {
      $ctrl.documentId = 'documentId';
      $ctrl.doc = testDocument;
      $ctrl.docType = testDocumentType;
      $ctrl.editing = true;

      CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
      ContentService.saveDraft.and.returnValue($q.resolve(testDocument));
      ContentService.createDraft.and.returnValue($q.resolve(newDocument));
      ContentService.deleteDraft.and.returnValue($q.resolve());
      ContentService.getDocumentType.and.returnValue($q.resolve(newDocumentType));
      spyOn($scope, '$broadcast');
    });

    function expectNewDocument() {
      expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('newdoc');
      expect(ContentService.createDraft).toHaveBeenCalledWith('newdoc');
      expect(ContentService.getDocumentType).toHaveBeenCalledWith('ns:newdoctype');

      expect($ctrl.doc).toEqual(newDocument);
      expect($ctrl.docType).toEqual(newDocumentType);
      expect($ctrl.form.$setPristine).toHaveBeenCalled();

      $timeout.flush();
      expect($scope.$broadcast).toHaveBeenCalledWith('md-resize-textarea');
    }

    it('does nothing when the same document is opened again', () => {
      $ctrl.form.$dirty = true;
      sidePanelHandlers.onOpen('documentId');
      expect(DialogService.show).not.toHaveBeenCalled();
      expect(ContentService.deleteDraft).not.toHaveBeenCalled();
    });

    it('can save pending changes before opening a new document', () => {
      $ctrl.form.$dirty = true;
      DialogService.show.and.returnValue($q.resolve('SAVE'));

      sidePanelHandlers.onOpen('newdoc');
      $rootScope.$digest();

      expect(DialogService.show).toHaveBeenCalled();
      expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);
      expect(ContentService.deleteDraft).toHaveBeenCalledWith('documentId');
      expect(CmsService.reportUsageStatistic).toHaveBeenCalledWith('CMSChannelsSaveDocument');
      expectNewDocument();
    });

    it('does not open the new document when saving pending changes in the old document failed', () => {
      $ctrl.form.$dirty = true;
      DialogService.show.and.returnValue($q.resolve('SAVE'));
      ContentService.saveDraft.and.returnValue($q.reject({}));

      sidePanelHandlers.onOpen('newdoc');
      $rootScope.$digest();

      expect(DialogService.show).toHaveBeenCalled();
      expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);
      expect(ContentService.deleteDraft).not.toHaveBeenCalled();
      expect(ContentService.createDraft).not.toHaveBeenCalled();
      expect(CmsService.reportUsageStatistic).not.toHaveBeenCalled();

      expect($ctrl.doc).toEqual(testDocument);
      expect($ctrl.docType).toEqual(testDocumentType);
    });

    it('can discard pending changes to an existing document before opening a new document', () => {
      $ctrl.form.$dirty = true;
      DialogService.show.and.returnValue($q.resolve('DISCARD'));

      sidePanelHandlers.onOpen('newdoc');
      $rootScope.$digest();

      expect(DialogService.show).toHaveBeenCalled();
      expect(ContentService.saveDraft).not.toHaveBeenCalled();
      expect(CmsService.reportUsageStatistic).not.toHaveBeenCalled();
      expect(ContentService.deleteDraft).toHaveBeenCalledWith('documentId');
      expectNewDocument();
    });

    it('does not change state when cancelling the reload of a document', () => {
      $ctrl.form.$dirty = true;
      DialogService.show.and.returnValue($q.reject()); // Say Cancel

      sidePanelHandlers.onOpen('newdoc');
      $rootScope.$digest();

      expect(DialogService.show).toHaveBeenCalled();
      expect(ContentService.saveDraft).not.toHaveBeenCalled();
      expect(ContentService.deleteDraft).not.toHaveBeenCalled();
      expect(ContentService.createDraft).not.toHaveBeenCalled();
    });

    it('does not save pending changes when there are none', () => {
      $ctrl.form.$dirty = false;

      sidePanelHandlers.onOpen('newdoc');
      $rootScope.$digest();

      expect(DialogService.show).not.toHaveBeenCalled();
      expect(ContentService.saveDraft).not.toHaveBeenCalled();
      expect(CmsService.reportUsageStatistic).not.toHaveBeenCalled();
      expect(ContentService.deleteDraft).toHaveBeenCalledWith('documentId');
      expectNewDocument();
    });
  });

  it('fails to open a document with pending invalid changes in the draft', () => {
    CmsService.closeDocumentWhenValid.and.returnValue($q.reject());

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_DRAFT_INVALID_MESSAGE');
  });

  it('fails to open a document owned by another user', () => {
    const response = {
      reason: 'OTHER_HOLDER',
      params: {
        userId: 'jtester',
        userName: 'John Tester',
        displayName: 'Display Name',
      },
    };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({ data: response }));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_HELD_BY_OTHER_USER_MESSAGE', { user: 'John Tester' });
    expect($translate.instant).toHaveBeenCalledWith('EDIT_DOCUMENT', response.params);
  });

  it('falls back to the user\'s id if there is no display name', () => {
    const response = {
      reason: 'OTHER_HOLDER',
      params: {
        userId: 'tester',
      },
    };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({ data: response }));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_HELD_BY_OTHER_USER_MESSAGE', { user: 'tester' });
    expect($translate.instant).not.toHaveBeenCalledWith('EDIT_DOCUMENT', response.params);
  });

  it('fails to open a document with a publication request', () => {
    const response = {
      reason: 'REQUEST_PENDING',
      params: {
        displayName: 'Display Name',
      },
    };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({ data: response }));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_REQUEST_PENDING_MESSAGE', { });
  });

  it('fails to open a document which is not a document', () => {
    const response = {
      reason: 'NOT_A_DOCUMENT',
    };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({ data: response }));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($ctrl.disableContentButtons).toBeFalsy();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_NOT_A_DOCUMENT_MESSAGE', { });
  });

  it('fails to open a non-existent document', () => {
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({ status: 404 }));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($ctrl.disableContentButtons).toBeTruthy();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_NOT_FOUND_MESSAGE', { });
  });

  it('fails to open a document with random data in the response', () => {
    const response = { bla: 'test' };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({ data: response }));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_DEFAULT_MESSAGE', { });
  });

  it('fails to open a document with no data in the response', () => {
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({}));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_DEFAULT_MESSAGE', { });
  });

  it('fails to open a document with an unknown error reason', () => {
    const response = {
      reason: 'unknown',
    };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.reject({ data: response }));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).not.toHaveBeenCalled();
    expect($ctrl.doc).toBeUndefined();
    expect($translate.instant).not.toHaveBeenCalledWith('FEEDBACK_DEFAULT_MESSAGE', { });
  });

  it('fails to open a document with no type', () => {
    const doc = {
      info: {
        type: {
          id: 'document:type',
        },
      },
      fields: {
        bla: 1,
      },
      displayName: 'Document Display Name',
    };
    CmsService.closeDocumentWhenValid.and.returnValue($q.resolve());
    ContentService.createDraft.and.returnValue($q.resolve(doc));
    ContentService.getDocumentType.and.returnValue($q.reject({}));

    sidePanelHandlers.onOpen('test');
    $rootScope.$digest();

    expect(CmsService.closeDocumentWhenValid).toHaveBeenCalledWith('test');
    expect(ContentService.createDraft).toHaveBeenCalledWith('test');
    expect(ContentService.getDocumentType).toHaveBeenCalledWith('document:type');
    expect($ctrl.doc).toBeUndefined();
    expect($ctrl.docType).toBeUndefined();
    expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_DEFAULT_MESSAGE', { });
  });

  it('saves a document', () => {
    const savedDoc = {
      id: '123',
    };
    ContentService.saveDraft.and.returnValue($q.resolve(savedDoc));

    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    $ctrl.saveDocument();

    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);

    $rootScope.$digest();

    expect($ctrl.doc).toEqual(savedDoc);
    expect($ctrl.form.$setPristine).toHaveBeenCalled();
    expect(HippoIframeService.reload).toHaveBeenCalled();
    expect(CmsService.reportUsageStatistic).toHaveBeenCalledWith('CMSChannelsSaveDocument');
  });

  it('does not save a document when there are no changes', () => {
    $ctrl.doc = testDocument;

    $ctrl.saveDocument();
    $rootScope.$digest();

    expect(ContentService.saveDraft).not.toHaveBeenCalled();
  });

  it('shows an error when document save fails', () => {
    const response = {
      reason: 'TEST',
    };
    ContentService.saveDraft.and.returnValue($q.reject({ data: response }));

    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    $ctrl.saveDocument();

    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);

    $rootScope.$digest();

    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_TEST', {});
    expect(CmsService.reportUsageStatistic).not.toHaveBeenCalled();
  });

  it('shows an error when document save fails due to other user now being the holder', () => {
    const response = {
      reason: 'OTHER_HOLDER',
      params: {
        userId: 'tester',
      },
    };
    ContentService.saveDraft.and.returnValue($q.reject({ data: response }));

    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    $ctrl.saveDocument();

    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);

    $rootScope.$digest();

    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_OTHER_HOLDER', { user: 'tester' });
  });

  it('shows an error when document save fails due to other *named* user now being the holder', () => {
    const response = {
      reason: 'OTHER_HOLDER',
      params: {
        userId: 'tester',
        userName: 'Joe Tester',
      },
    };
    ContentService.saveDraft.and.returnValue($q.reject({ data: response }));

    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    $ctrl.saveDocument();

    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);

    $rootScope.$digest();

    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_OTHER_HOLDER', { user: 'Joe Tester' });
  });

  describe('when document save fails because of an invalid field', () => {
    beforeEach(() => {
      const saveResponse = angular.copy(testDocument);
      saveResponse.fields['ns:string'] = [
        {
          value: '',
          errorInfo: {
            code: 'REQUIRED_FIELD_EMPTY',
          },
        },
      ];

      ContentService.saveDraft.and.returnValue($q.reject({ data: saveResponse }));

      $ctrl.doc = testDocument;
      $ctrl.docType = testDocumentType;
      $ctrl.form.$dirty = true;
    });

    it('shows an error and reloads the document type', () => {
      const reloadedDocumentType = angular.copy(testDocumentType);
      ContentService.getDocumentType.and.returnValue($q.resolve(reloadedDocumentType));

      $ctrl.saveDocument();

      expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);

      $rootScope.$digest();

      expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_INVALID_DATA', {});
      expect(ContentService.getDocumentType).toHaveBeenCalledWith('ns:testdocument');
      expect($ctrl.docType).toBe(reloadedDocumentType);
    });

    it('shows an error when reloading the document type fails', () => {
      ContentService.getDocumentType.and.returnValue($q.reject({ status: 404 }));

      $ctrl.saveDocument();

      expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);

      $rootScope.$digest();

      expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_INVALID_DATA', {});
      expect(ContentService.getDocumentType).toHaveBeenCalledWith('ns:testdocument');
      expect($translate.instant).toHaveBeenCalledWith('FEEDBACK_NOT_FOUND_MESSAGE', {});
      expect($ctrl.docType).toBe(testDocumentType);
    });
  });

  it('shows an error when document save fails and there is no data returned', () => {
    ContentService.saveDraft.and.returnValue($q.reject({}));

    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    $ctrl.saveDocument();

    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);

    $rootScope.$digest();

    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_UNABLE_TO_SAVE', {});
  });

  it('directly opens the content editor in a certain mode if the form is not dirty', () => {
    $ctrl.documentId = 'test';
    SidePanelService.close.and.returnValue($q.resolve());

    const mode = 'view';
    $ctrl.openContentEditor(mode);

    expect($ctrl.deleteDraftOnClose).toBe(false);

    $rootScope.$digest();

    expect(ContentService.saveDraft).not.toHaveBeenCalled();
    expect(ContentService.deleteDraft).not.toHaveBeenCalled();
    expect(SidePanelService.close).toHaveBeenCalledWith('right');
    expect(CmsService.publish).toHaveBeenCalledWith('open-content', 'test', mode);
    expect(CmsService.reportUsageStatistic).toHaveBeenCalledWith('CMSChannelsContentPublish');
  });

  it('can discard pending changes before opening the content editor', () => {
    DialogService.show.and.returnValue($q.resolve('DISCARD'));
    SidePanelService.close.and.callFake(() => {
      sidePanelHandlers.onClose();
      return $q.resolve();
    });
    $ctrl.documentId = 'test';
    $ctrl.doc = { displayName: 'Display Name' };
    $ctrl.form.$dirty = true;

    $ctrl.openContentEditor('edit');

    expect($ctrl.deleteDraftOnClose).toBe(false);

    $rootScope.$digest();

    expect(DialogService.show).toHaveBeenCalled();
    expect(DialogService.show.calls.count()).toEqual(1);
    expect(ContentService.saveDraft).not.toHaveBeenCalled();
    expect(ContentService.deleteDraft).not.toHaveBeenCalled();
    expect(SidePanelService.close).toHaveBeenCalledWith('right');
    expect(CmsService.publish).toHaveBeenCalledWith('open-content', 'test', 'edit');
    expect(CmsService.reportUsageStatistic).toHaveBeenCalledWith('CMSChannelsContentEditor');
  });

  it('saves pending changes before opening the content editor', () => {
    DialogService.show.and.returnValue($q.resolve('SAVE'));
    $ctrl.documentId = 'test';
    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    ContentService.saveDraft.and.returnValue($q.resolve(testDocument));
    SidePanelService.close.and.returnValue($q.resolve());

    $ctrl.openContentEditor('edit');

    expect($ctrl.deleteDraftOnClose).toBe(false);

    $rootScope.$digest();

    expect(DialogService.show).toHaveBeenCalled();
    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);
    expect(ContentService.deleteDraft).not.toHaveBeenCalled();
    expect(SidePanelService.close).toHaveBeenCalledWith('right');
    expect(CmsService.publish).toHaveBeenCalledWith('open-content', 'test', 'edit');
    expect(CmsService.reportUsageStatistic.calls.allArgs()).toEqual([
      ['CMSChannelsSaveDocument'],
      ['CMSChannelsContentEditor'],
    ]);
  });

  it('releases holdership of the document when publishing it', () => {
    DialogService.show.and.returnValue($q.resolve('SAVE'));
    $ctrl.documentId = 'documentId';
    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    $ctrl.editing = true;
    ContentService.saveDraft.and.returnValue($q.resolve(testDocument));
    ContentService.deleteDraft.and.returnValue($q.resolve());
    SidePanelService.close.and.returnValue($q.resolve());

    $ctrl.openContentEditor('view');
    $rootScope.$digest();

    expect(DialogService.show).toHaveBeenCalled();
    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);
    expect(ContentService.deleteDraft).toHaveBeenCalledWith('documentId');
    expect(SidePanelService.close).toHaveBeenCalledWith('right');
    expect(CmsService.publish).toHaveBeenCalledWith('open-content', 'documentId', 'view');
  });

  it('does not open the content editor if saving changes failed', () => {
    DialogService.show.and.returnValue($q.resolve('SAVE'));
    $ctrl.documentId = 'documentId';
    $ctrl.doc = testDocument;
    $ctrl.form.$dirty = true;
    $ctrl.editing = true;
    ContentService.saveDraft.and.returnValue($q.reject({}));

    $ctrl.openContentEditor('view');
    $rootScope.$digest();

    expect(DialogService.show).toHaveBeenCalled();
    expect(ContentService.saveDraft).toHaveBeenCalledWith(testDocument);
    expect(ContentService.deleteDraft).not.toHaveBeenCalled();
    expect(SidePanelService.close).not.toHaveBeenCalled();
    expect(CmsService.publish).not.toHaveBeenCalled();
  });

  it('subscribes to the kill-editor event', () => {
    expect(CmsService.subscribe).toHaveBeenCalled();
    const onKillEditor = CmsService.subscribe.calls.mostRecent().args[1];

    SidePanelService.close.and.returnValue($q.resolve());
    $ctrl.documentId = 'documentId';

    onKillEditor('differentId');
    expect($ctrl.deleteDraftOnClose).toBe(true);
    expect(SidePanelService.close).not.toHaveBeenCalled();

    onKillEditor('documentId');
    expect($ctrl.deleteDraftOnClose).toBe(false);
    expect(SidePanelService.close).toHaveBeenCalled();
  });

  it('should close right side panel', () => {
    spyOn(ChannelService, 'setToolbarDisplayed');
    spyOn($ctrl, 'setFullWidth');
    SidePanelService.close.and.returnValue($q.resolve());

    ChannelService.isToolbarDisplayed = false;
    $ctrl._closePanel();
    $scope.$apply();

    expect(ChannelService.setToolbarDisplayed).toHaveBeenCalledWith(true);
    expect($ctrl.setFullWidth).toHaveBeenCalledWith(false);
  });
});

