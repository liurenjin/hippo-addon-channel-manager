import { DocumentFieldsComponent } from './document-fields.component';
import { IDocument } from '../shared/document.interface';

const stringField = { id: 'ns:string', type: 'STRING' };
const multipleStringField = { id: 'ns:multiplestring', type: 'STRING' };
const emptyMultipleStringField = { id: 'ns:emptymultiplestring', type: 'STRING' };
const compoundField = { id: 'ns:compound', type: 'COMPOUND' };

const testDocumentType = {
  id: 'ns:testdocument',
  fields: [stringField, multipleStringField, emptyMultipleStringField, compoundField]
};

// IDocument
const testDocument: IDocument = {
  id: 'test',
  info: { type: { id: 'ns:testdocument' }, dirty: false },
  fields: {
    'ns:string': ['String value'],
    'ns:multiplestring': ['One', 'Two'],
    'ns:emptymultiplestring': [],
    'ns:compound': [ { 'ns:string': 'String value in compound' } ]
  }
};

describe('DocumentsFieldComponent', () => {
  let component: DocumentFieldsComponent;
  let onFieldFocus;
  let onFieldBlur;

  beforeEach(() => {
    onFieldFocus = jasmine.createSpy('onFieldFocus');
    onFieldBlur = jasmine.createSpy('onFieldBlur');

    component = new DocumentFieldsComponent();
    component.fieldTypes = testDocumentType;
    component.fieldValues = testDocument.fields;
    component.onFieldFocus = onFieldFocus;
    component.onFieldBlur = onFieldBlur;

    component.ngOnInit();
  });

  it('initializes component', () => {
      expect(component.fieldTypes).toEqual(testDocumentType);
      expect(component.fieldValues).toBeDefined(testDocument.fields);
  });

  it('recognizes an empty multiple field', () => {
    expect(component.hasValue(stringField)).toBe(true);
    expect(component.hasValue(multipleStringField)).toBe(true);
    expect(component.hasValue(emptyMultipleStringField)).toBe(false);

    testDocument.fields['invalid'] = 'not an array';
    expect(component.hasValue({ id: 'invalid' })).toBe(false);
  });

  it('ignores the oanFieldFocus and onFieldBlur callbacks when they are not defined', () => {
    expect(() => {
      component.ngOnInit();
      component.onFieldFocus();
      component.onFieldBlur();
    }).not.toThrow();
  });

  it('generates names for root-level fields', () => {
    expect(component.getFieldName(stringField)).toEqual('ns:string');
    expect(component.getFieldName(multipleStringField)).toEqual('ns:multiplestring');
    expect(component.getFieldName(multipleStringField, 0)).toEqual('ns:multiplestring');
    expect(component.getFieldName(multipleStringField, 1)).toEqual('ns:multiplestring[2]');
    expect(component.getFieldName(compoundField)).toEqual('ns:compound');
  });

  it('generates names for nested fields', () => {
    component.ngOnInit();
    component.fieldName = 'ns:compound';
    component.fieldTypes = compoundField;
    component.fieldValues = { id: 'someId', fields: [stringField] };
    expect(component.getFieldName(stringField)).toEqual('ns:compound/ns:string');
  });

  it('generates a unique hash per field type based on the ID and validators of a field', () => {
    expect(component.getFieldTypeHash({ id: 'hap:title' })).toEqual('hap:title:undefined');
    expect(component.getFieldTypeHash({ id: 'hap:title', validators: ['REQUIRED'] })).toEqual('hap:title:REQUIRED');
    expect(component.getFieldTypeHash({ id: 'hap:title', validators: ['REQUIRED', 'OTHER'] })).toEqual('hap:title:REQUIRED,OTHER');
  });

});
