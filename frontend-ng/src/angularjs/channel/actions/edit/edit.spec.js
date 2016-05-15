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

describe('ChannelActionEdit', () => {
  'use strict';

  let $scope;
  let $rootScope;
  let $compile;
  let $log;
  let $translate;
  let $element;
  let $q;
  let ChannelService;
  let FeedbackService;
  let HippoIframeService;
  let channelInfoDescription;
  const channel = {
    properties: {
      textField: 'summer',
      dropDown: 'large',
      boolean: true,
    },
  };

  beforeEach(() => {
    module('hippo-cm');

    inject((_$rootScope_, _$compile_, _$q_, _$log_, _$translate_, _ChannelService_, _FeedbackService_, _HippoIframeService_) => {
      $rootScope = _$rootScope_;
      $compile = _$compile_;
      $log = _$log_;
      $translate = _$translate_;
      $q = _$q_;
      ChannelService = _ChannelService_;
      FeedbackService = _FeedbackService_;
      HippoIframeService = _HippoIframeService_;
    });

    channelInfoDescription = {
      fieldGroups: [
        { value: ['textField', 'dropDown', 'boolean'],
          titleKey: 'group1',
        },
      ],
      propertyDefinitions: {
        textField: {
          isRequired: false,
          defaultValue: '',
          name: 'textField',
          valueType: 'STRING',
          annotations: [],
        },
        dropDown: {
          isRequired: false,
          defaultValue: '',
          name: 'dropDown fallback',
          valueType: 'STRING',
          annotations: [
            {
              type: 'DropDownList',
              value: ['small', 'medium', 'large'],
            },
          ],
        },
        boolean: {
          isRequired: false,
          defaultValue: false,
          name: 'boolean fallback',
          valueType: 'BOOLEAN',
          annotations: [],
        },
      },
      i18nResources: {
        textField: 'Text Field',
        dropDown: 'Drop Down',
        boolean: 'Boolean',
        group1: 'Field Group 1',
      },
    };

    spyOn($translate, 'instant');
    spyOn(ChannelService, 'getName').and.returnValue('test-name');
    spyOn(ChannelService, 'getChannel').and.returnValue(channel);
    spyOn(ChannelService, 'getChannelInfoDescription').and.returnValue($q.when(channelInfoDescription));
  });

  function compileDirectiveAndGetController() {
    $scope = $rootScope.$new();
    $scope.onDone = jasmine.createSpy('onDone');
    $scope.onError = jasmine.createSpy('onError');
    $scope.onSuccess = jasmine.createSpy('onSuccess');

    $element = angular.element(`
      <channel-edit on-done="onDone()" on-success="onSuccess(key, params)" on-error="onError(key, params)">
      </channel-edit>
    `);
    $compile($element)($scope);
    $scope.$digest();

    return $element.controller('channel-edit');
  }

  it('initializes correctly when fetching channel setting from backend is successful', () => {
    compileDirectiveAndGetController();

    expect(ChannelService.getName).toHaveBeenCalled();
    expect($translate.instant).toHaveBeenCalledWith('SUBPAGE_CHANNEL_EDIT_TITLE', { channelName: 'test-name' });

    expect($element.find('.qa-action').is(':disabled')).toBe(true);
    expect($element.find('.qa-fieldgroup').text()).toBe('Field Group 1');
    expect($element.find('.qa-field-textField label').text()).toBe('Text Field');
    expect($element.find('.qa-field-dropDown label').text()).toBe('Drop Down');
  });

  it('enables "save" button when form is dirty', () => {
    compileDirectiveAndGetController();

    $scope.form.$setDirty();
    $scope.$digest();

    expect($element.find('.qa-action').is(':enabled')).toBe(true);
  });

  it('notifies the event "on-error" when fetching channel setting from backend is failed', () => {
    ChannelService.getChannelInfoDescription.and.returnValue($q.reject());
    compileDirectiveAndGetController();

    expect($scope.onError).toHaveBeenCalledWith('ERROR_CHANNEL_INFO_RETRIEVAL_FAILED', undefined);
  });

  it('notifies the event "on-done" when clicking the back button', () => {
    compileDirectiveAndGetController();

    $element.find('.qa-button-back').click();
    expect($scope.onDone).toHaveBeenCalled();
  });

  it('notifies the event "on-success" when saving is successful', () => {
    spyOn(ChannelService, 'saveChannel').and.returnValue($q.when());
    spyOn(ChannelService, 'recordOwnChange');
    spyOn(HippoIframeService, 'reload');
    compileDirectiveAndGetController();

    $scope.form.$setDirty();
    $scope.$digest();
    $element.find('.qa-action').click();

    expect(ChannelService.saveChannel).toHaveBeenCalled();
    expect(HippoIframeService.reload).toHaveBeenCalled();
    expect(ChannelService.recordOwnChange).toHaveBeenCalled();
    expect($scope.onSuccess).toHaveBeenCalledWith('CHANNEL_PROPERTIES_SAVE_SUCCESS', undefined);
  });

  it('shows feedback message when saving is failed', () => {
    spyOn(ChannelService, 'saveChannel').and.returnValue($q.reject());
    spyOn(FeedbackService, 'showError');
    compileDirectiveAndGetController();
    const feedbackParent = $element.find('.feedback-parent');

    $scope.form.$setDirty();
    $scope.$digest();
    $element.find('.qa-action').click();

    expect(ChannelService.saveChannel).toHaveBeenCalled();
    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_CHANNEL_PROPERTIES_SAVE_FAILED', undefined, feedbackParent);
  });

  it('applies a fall-back strategy when determining a field label', () => {
    const ChannelEditCtrl = compileDirectiveAndGetController();
    expect(ChannelEditCtrl.getLabel('textField')).toBe('Text Field');

    delete channelInfoDescription.i18nResources.textField;
    expect(ChannelEditCtrl.getLabel('textField')).toBe('textField');
  });

  it('applies a fall-back strategy when determining the type of a field', () => {
    channelInfoDescription.propertyDefinitions.invalidFieldTypeField = {
      isRequired: false,
      defaultValue: '',
      name: 'bla',
      valueType: 'ANYTHING_BUT_NO_BOOLEAN',
      annotations: [
        {
          type: 'Invalid',
        },
      ],
    };
    const ChannelEditCtrl = compileDirectiveAndGetController();
    expect(ChannelEditCtrl.getType('invalidFieldTypeField')).toBe('InputBox');
  });

  it('applies a sanity check on drop-down fields', () => {
    const ChannelEditCtrl = compileDirectiveAndGetController();

    expect(ChannelEditCtrl.getDropDownListValues('unknownField')).toEqual([]);

    // too many annotations only triggers a warning
    spyOn($log, 'warn');
    channelInfoDescription.propertyDefinitions.dropDown.annotations.push({ });
    expect(ChannelEditCtrl.getDropDownListValues('dropDown')).toEqual(['small', 'medium', 'large']);
    channelInfoDescription.propertyDefinitions.dropDown.annotations.pop({ });
    expect($log.warn).toHaveBeenCalled();

    channelInfoDescription.propertyDefinitions.dropDown.annotations[0].type = 'InputBox';
    expect(ChannelEditCtrl.getDropDownListValues('dropDown')).toEqual([]);
  });

  it('manipulates the channel\'s properties', () => {
    const properties = { };
    spyOn(ChannelService, 'getProperties').and.returnValue(properties);
    spyOn(ChannelService, 'setProperties');
    const ChannelEditCtrl = compileDirectiveAndGetController();

    expect(ChannelService.getProperties).toHaveBeenCalled();
    expect(ChannelEditCtrl.values).toBe(properties);

    properties.key = 'value';
    ChannelEditCtrl.save();
    expect(ChannelService.setProperties).toHaveBeenCalledWith(properties);
  });
});
