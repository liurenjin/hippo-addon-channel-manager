/*
 * Copyright 2015 Hippo B.V. (http://www.onehippo.com)
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
(function () {
  "use strict";

  angular.module("hippo.channel.menu")

  /**
   * @ngdoc directive
   * @name hippo.channel.menu:keepScrollPos
   * @restrict A
   *
   * @description
   * Remembers the vertical scroll position of an element when the app state changes,
   * and restores the vertical scroll position once the element becomes visible again.
   */
    .directive("keepScrollPos", [
      '$timeout',
      function ($timeout) {
        var scrollPos = 0;
        return {
          restrict: 'A',
          link: function (scope, element) {
            scope.$on('$stateChangeStart', function () {
              scrollPos = element.scrollTop();
            });
            scope.$on('$stateChangeSuccess', function () {
              if (scrollPos > 0) {
                $timeout(function () {
                  element.scrollTop(scrollPos);
                  scrollPos = 0;
                }, 0);
              }
            });
          }
        };
      }
    ]);
}());