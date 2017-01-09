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

class ViewportService {

  constructor() {
    'ngInject';

    this.width = 0;
  }

  init($iframe) {
    this.$iframe = $iframe;
  }

  setWidth(width) {
    this.width = width;

    if (width === 0) {
      // Desktop mode - no width constraints
      this.$iframe.css('max-width', '100%');
    } else {
      // viewport is constrained
      this.$iframe.css('max-width', `${width}px`);
    }
  }

  getWidth() {
    return this.width;
  }
}

export default ViewportService;
