import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'hippo-document-form',
  templateUrl: './document-form.html'
})
export class DocumentFormComponent {
  @Input('name') fieldName: string;
  @Input() form: any;
  @Input() fieldTypes: any;
  @Input() fieldValues: any;

  constructor() { }
}
