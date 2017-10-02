import { NgModule } from '@angular/core';
import { ImageLinkComponent } from './imageLink/imageLink.component';
import { MaterialModule } from '../../../../material/material.module';
import { DocumentFormComponent } from './documentForm/documentForm.component';
import { DocumentFieldsComponent } from './documentFields/upgrade/documentFields.component';

@NgModule({
  imports: [
    MaterialModule,
  ],
  declarations: [
    ImageLinkComponent,
    DocumentFormComponent,
    DocumentFieldsComponent
  ],
  entryComponents: [
    ImageLinkComponent,
    DocumentFormComponent,
  ]
})
export class FieldsModule {
}
