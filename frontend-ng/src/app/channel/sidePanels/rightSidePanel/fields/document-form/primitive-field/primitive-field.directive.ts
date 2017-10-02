import { Directive, ElementRef, EventEmitter, Injector, Input, Output } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

@Directive({
  selector: 'hippo-primitive-field'
})
export class PrimitiveFieldDirective extends UpgradeComponent {
  @Input() fieldName: string;
  @Input() fieldType: Object;
  @Input() fieldValues: Object;
  @Output() onFieldFocus: EventEmitter<any>;
  @Output() onFieldBlur: EventEmitter<any>;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('primitiveField', elementRef, injector);
  }
}
