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
