import { Component, EventEmitter, Input, Output, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import './create-content.scss';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Rx';

@Component({
  selector: 'hippo-create-content',
  templateUrl: './create-content.html'
})
export class CreateContentComponent implements AfterViewInit {
  @Input() document: any;
  @Output() onClose: EventEmitter<any> = new EventEmitter();
  @Output() onContinue: EventEmitter<any> = new EventEmitter();
  @ViewChild('form') form: HTMLFormElement;
  @ViewChild('documentNameInput') documentNameInput: ElementRef;

  public documentUrlField: string;
  public isDocumentUrlFieldDisabled: boolean = true;
  public docTypes: Array<string> = [];

  ngAfterViewInit() {
    this.docTypes = ['Product', 'Event'];

    Observable.fromEvent(this.documentNameInput.nativeElement, 'keyup')
      .debounceTime(1000)
      .subscribe(() => this.setDocumentUrlByName(this.form.controls.documentName.value));
  }

  setDocumentUrlByName(name: string) {
    // TODO: back-end call
    setTimeout(() => {
      name = name.toLowerCase();
      name = name.replace(/\s+/g, '-').toLowerCase();
      this.documentUrlField = name;
    }, 500);
  }

  close() {
    this.onClose.emit();
  }

  submit(form: NgForm) {
    console.log(form);
    // this.onContinue.emit(form.value);
  }
}
