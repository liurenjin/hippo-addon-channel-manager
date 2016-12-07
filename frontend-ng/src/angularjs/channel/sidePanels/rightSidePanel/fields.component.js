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

import collapse from './collapse.directive';
import template from './fields.html';

class ChannelFieldsCtrl {

  $onInit() {
    this.onFieldFocus = this.onFieldFocus || angular.noop;
    this.onFieldBlur = this.onFieldBlur || angular.noop;
  }

  getFieldName(fieldType, index) {
    const fieldName = this.name ? `${this.name}/${fieldType.id}` : fieldType.id;
    return index > 0 ? `${fieldName}[${index}]` : fieldName;
  }

  getFieldError(fieldType) {
    const fieldValues = this.fieldValues[fieldType.id];
    if (fieldValues) {
      return fieldValues.length === 1 ? this._getSingleFieldError(fieldType) : this._getMultipleFieldError(fieldType, fieldValues);
    }
    return null;
  }

  _getSingleFieldError(fieldType) {
    const fieldName = this.getFieldName(fieldType);
    const field = this.form[fieldName];
    return field ? field.$error : null;
  }

  _getMultipleFieldError(fieldType, fieldValues) {
    let combinedError = null;
    for (let i = 0, len = fieldValues.length; i < len; i += 1) {
      const fieldName = this.getFieldName(fieldType, i);
      const field = this.form[fieldName];
      if (field) {
        combinedError = angular.extend(combinedError || {}, field.$error);
      }
    }
    return combinedError;
  }

  isValid(fieldType) {
    const fieldValues = this.fieldValues[fieldType.id];
    if (fieldValues) {
      for (let i = 0, len = fieldValues.length; i < len; i += 1) {
        const fieldName = this.getFieldName(fieldType, i);
        const field = this.form[fieldName];
        if (field && field.$invalid) {
          return false;
        }
      }
    }
    return true;
  }

  hasValue(field) {
    const values = this.fieldValues[field.id];
    return angular.isArray(values) && values.length > 0;
  }

  getDisplayNameForCompound(field, index) {
    if (this.hasValue(field)) {
      const values = this.fieldValues[field.id];
      if (values.length > 1) {
        return `${field.displayName} (${index + 1})`;
      }
    }

    return field.displayName;
  }

  focusCompound(fieldValue) {
    this.compoundWithFocusedField = fieldValue;
    this.onFieldFocus();
  }

  blurCompound() {
    this.compoundWithFocusedField = null;
    this.onFieldBlur();
  }

  hasFocusedField(fieldValue) {
    return this.compoundWithFocusedField === fieldValue;
  }

  focusFieldType(fieldType) {
    this.fieldTypeWithFocus = fieldType;
    this.onFieldFocus();
  }

  blurFieldType() {
    delete this.fieldTypeWithFocus;
    this.onFieldBlur();
  }

  hasFocusedFieldType(fieldType) {
    return this.fieldTypeWithFocus === fieldType;
  }
}

const channelFieldsComponentModule = angular
  .module('hippo-cm.channel.fieldsComponentModule', [])
  .component('channelFields', {
    bindings: {
      name: '@',
      fieldTypes: '=',
      fieldValues: '=',
      onFieldFocus: '&',
      onFieldBlur: '&',
    },
    controller: ChannelFieldsCtrl,
    require: {
      form: '^^form',
    },
    template,
  })
  .directive('collapse', collapse);

export default channelFieldsComponentModule;
