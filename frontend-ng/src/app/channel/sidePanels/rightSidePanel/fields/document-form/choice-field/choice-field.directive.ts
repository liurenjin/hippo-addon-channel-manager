import { Directive, ElementRef, EventEmitter, Injector, Input, Output } from '@angular/core';
import { UpgradeComponent } from '@angular/upgrade/static';

@Directive({
  selector: 'hippo-choice-field'
})
export class ChoiceFieldDirective extends UpgradeComponent {
  @Input() fieldType: Object;
  @Input() fieldValues: Object;
  @Output() onFieldFocus: EventEmitter<any>;
  @Output() onFieldBlur: EventEmitter<any>;

  constructor(elementRef: ElementRef, injector: Injector) {
    super('choiceField', elementRef, injector);
  }
}
