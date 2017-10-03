/*
 * Copyright 2017 Hippo B.V. (http://www.onehippo.com)
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

import { Component, Input, OnInit, Output } from '@angular/core';
import { IFieldType } from '../shared/field-type.interface';
import { IFieldValue } from '../shared/field-value.interface';
import { IDocument } from '../shared/document.interface';

@Component({
  selector: 'hippo-document-fields',
  templateUrl: './document-fields.html'
})
export class DocumentFieldsComponent implements OnInit {
  @Input('name') fieldName: string;
  @Input() fieldTypes: IFieldType;
  @Input() fieldValues: IDocument;
  @Output() onFieldFocus: Function;
  @Output() onFieldBlur: Function;

  ngOnInit() {
    this.onFieldFocus = this.onFieldFocus || (() => {});
    this.onFieldBlur = this.onFieldBlur || (() => {});
  }

  getFieldName(fieldType: IFieldType, index?: number) {
    const fieldName = this.fieldName ? `${this.fieldName}/${fieldType.id}` : fieldType.id;
    return index > 0 ? `${fieldName}[${index + 1}]` : fieldName;
  }

  getFieldTypeHash(fieldType: IFieldType) {
    return `${fieldType.id}:${fieldType.validators}`;
  }

  hasValue(field) {
    const values = this.fieldValues[field.id];
    return Array.isArray(values) && values.length > 0;
  }
}
