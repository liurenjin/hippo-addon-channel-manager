import { DocumentFieldsComponent } from './document-fields.component';
import { DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

fdescribe('DocumentsFieldComponent', () => {
  let comp:   DocumentFieldsComponent;
  let fixture: ComponentFixture<DocumentFieldsComponent>;
  let de:     DebugElement;
  let el:     HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DocumentFieldsComponent]
    });

    fixture = TestBed.createComponent(DocumentFieldsComponent);
    comp = fixture.componentInstance;
  });

  it('should work', () => {
    expect(true).toBe(true);
  })
});
