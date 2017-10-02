import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { MaterialModule } from '../../../../material/material.module';

import { ImageLinkComponent } from './imageLink/imageLink.component';
import { DocumentFormComponent } from './document-form/document-form.component';
import { DocumentFieldsDirective } from './document-form/document-fields/document-fields.directive';
import { PrimitiveFieldDirective } from './document-form/primitive-field/primitive-field.directive';
import { CompoundFieldDirective } from './document-form/compound-field/compound-field.directive';
import { ChoiceFieldDirective } from './document-form/choice-field/choice-field.directive';

@NgModule({
  imports: [
    MaterialModule,
    BrowserModule
  ],
  declarations: [
    ImageLinkComponent,
    DocumentFormComponent,
    DocumentFieldsDirective,
    PrimitiveFieldDirective,
    CompoundFieldDirective,
    ChoiceFieldDirective
  ],
  entryComponents: [
    ImageLinkComponent,
    DocumentFormComponent,
  ]
})
export class FieldsModule {
}
