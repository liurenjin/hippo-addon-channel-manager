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

class SharedSpaceToolbarService {
  constructor() {
    'ngInject';

    this.triggerCallback = angular.noop;
  }

  registerTriggerCallback(fn) {
    this.triggerCallback = fn;
  }

  showToolbar(options) {
    this.triggerCallback(true, {
      hasBottomToolbar: options.hasBottomToolbar,
    });
  }

  hideToolbar() {
    this.triggerCallback(false);
  }
}

export default SharedSpaceToolbarService;