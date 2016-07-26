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

export function selectAllOnFocusDirective() {
  'ngInject';

  return {
    restrict: 'A',
    link: (scope, element) => {
      element.focus(() => {
        const domElement = element[0];
        if (angular.isFunction(domElement.select)) {
          domElement.select();
        }
      });
      element.mouseup((event) => {
        // Safari immediately deselects all when the mouseup event happens, so prevent that
        event.preventDefault();
      });
    },
  };
}
