/*
 * Copyright 2016 Hippo B.V. (http://www.onehippo.com)
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

import MultiActionDialogCtrl from './multiActionDialog.controller';

describe('hippoIframeCtrl', () => {
  const $mdDialog = jasmine.createSpyObj('$mdDialog', ['hide', 'cancel']);
  let $ctrl;

  beforeEach(() => {
    $ctrl = new MultiActionDialogCtrl($mdDialog);
  });

  it('hides the dialog with the given action', () => {
    $ctrl.action('transparent');

    expect($mdDialog.hide).toHaveBeenCalledWith('transparent');
  });

  it('cancels the dialog', () => {
    $ctrl.cancel();

    expect($mdDialog.cancel).toHaveBeenCalled();
  });
});