import { Component, Directive, ElementRef, EventEmitter, Injector, Input, Output } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

@Directive({
  selector: 'hippo-document-fields',
})
export class DocumentFieldsComponent extends UpgradeComponent {
  @Input() fieldTypes: any;
  @Input() fieldValues: any;
  @Output() onFieldFocus: EventEmitter<any>;
  @Output() onFieldBlur: EventEmitter<any>;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('hippoDocumentFields', elementRef, injector);
  }
}
