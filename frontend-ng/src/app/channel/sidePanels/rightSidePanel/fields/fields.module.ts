import { NgModule } from '@angular/core';
import { ImageLinkComponent } from './imageLink/imageLink.component';
import { MaterialModule } from '../../../../material/material.module';
import { documentFormComponent } from './documentForm/documentForm.component';

@NgModule({
  imports: [
    MaterialModule,
  ],
  declarations: [
    ImageLinkComponent,
    documentFormComponent
  ],
  entryComponents: [
    ImageLinkComponent,
    documentFormComponent
  ]
})
export class FieldsModule {
}
