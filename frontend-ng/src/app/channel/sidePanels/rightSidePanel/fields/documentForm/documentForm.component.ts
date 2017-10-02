import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'hippo-document-form',
  templateUrl: './documentForm.html'
})
export class DocumentFormComponent implements OnInit {
  @Input() form: any;
  @Input() fieldTypes: any;
  @Input() fieldValues: any;

  constructor() {
    console.log('documentFormComponent init');

    console.log(this);
  }

  ngOnInit() {
  }

  onFocus() {
    console.log('focus');
  }

  onBlur() {
    console.log('blur');
  }
}
