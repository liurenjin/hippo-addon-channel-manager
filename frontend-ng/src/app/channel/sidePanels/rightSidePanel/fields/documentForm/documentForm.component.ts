import { Component, Input, OnInit } from '@angular/core';
import './documentForm.scss';

@Component({
  selector: 'document-form',
  templateUrl: './documentForm.html'
})
export class documentFormComponent implements OnInit {
  @Input() formName: string;
  @Input() fieldTypes: any;
  @Input() fieldValues: any;

  constructor() {
    console.log('documentFormComponent init');

    console.log(this);
  }

  ngOnInit() {
  }
}
