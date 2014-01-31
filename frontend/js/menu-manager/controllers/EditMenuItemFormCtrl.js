/*
 * Copyright 2014 Hippo B.V. (http://www.onehippo.com)
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

    angular.module('hippo.channelManager.menuManager')

        .controller('hippo.channelManager.menuManager.EditMenuItemFormCtrl', ['$scope', '$location', function ($scope, $location) {

            function setDestinationProperty(item) {
                if (item && !item.destination) {
                    if (item.externalLink) {
                        item.destination = 2;
                    } else if (item.siteMapItemPath) {
                        item.destination = 1;
                    } else {
                        item.destination = 3;
                    }
                }
            }

            // make sure there is a destination property
            $scope.$parent.$watch('selectedMenuItem', function (item) {
                setDestinationProperty(item);
            });

            $scope.createNewPage = function () {
                $location.path('/' + $scope.selectedMenuItemId + '/add-page');
            };

        }]);
}());