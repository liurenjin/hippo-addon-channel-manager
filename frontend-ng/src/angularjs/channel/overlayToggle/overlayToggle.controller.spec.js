/*
 * Copyright 2015-2017 Hippo B.V. (http://www.onehippo.com)
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

import angular from 'angular';
import 'angular-mocks';

describe('overlayToggle component', () => {
  let $ctrl;

  beforeEach(() => {
    angular.mock.module('hippo-cm');

    inject((
      $componentController,
    ) => {
      $ctrl = $componentController('overlayToggle', {}, {
        state: false,
        icon: 'md-icon-name',
        tooltip: 'Test tooltip',
      });
    });
  });

  it('should initialize component controller', () => {
    expect($ctrl.state).toEqual(false);
    expect($ctrl.icon).toEqual('md-icon-name');
    expect($ctrl.tooltip).toEqual('Test tooltip');
  });

  it('should toggle overlay state', () => {
    expect($ctrl.state).toEqual(false);
    $ctrl.toggleState();
    expect($ctrl.state).toEqual(true);
    $ctrl.toggleState();
    expect($ctrl.state).toEqual(false);
  });
});