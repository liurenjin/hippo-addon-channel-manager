/*
 * Copyright 2017 Hippo B.V. (http://www.onehippo.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NgModule } from '@angular/core';
import { CreateContentComponent } from './createContentForm/create-content.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../shared/shared.module';
import { HintsComponent } from '../../../shared/components/hints/hints.component';

@NgModule({
  imports: [
    SharedModule,
    FormsModule
  ],
  declarations: [
    CreateContentComponent,
    HintsComponent
  ],
  entryComponents: [
    CreateContentComponent
  ]
})
export class RightSidePanelModule {}
