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

        .controller('hippo.channelManager.menuManager.EditMenuItemCtrl', [
            '$scope',
            '$stateParams',
            '$state',
            'hippo.channelManager.menuManager.MenuService',
            'hippo.channelManager.menuManager.FocusService',
            function ($scope, $stateParams, $state, MenuService, FocusService) {
                var savedMenuItem;

                $scope.isSaving = {
                    name: false,
                    linkType: false,
                    link: false
                };

                $scope.isSaved = {
                    name: true,
                    linkType: true,
                    link: true
                };

                function shouldSaveSelectedMenuItemProperty(propertyName) {
                    if (!angular.isDefined($scope.selectedMenuItem)) {
                        return false;
                    }
                    return $scope.selectedMenuItem[propertyName] !== savedMenuItem[propertyName];
                }

                function saveSelectedMenuItemProperty(propertyName) {
                    savedMenuItem = angular.copy($scope.selectedMenuItem);

                    $scope.isSaving[propertyName] = true;

                    MenuService.saveMenuItem($scope.selectedMenuItem).then(function () {
                        $scope.isSaving[propertyName] = false;
                        $scope.isSaved[propertyName] = true;
                    },
                    function () {
                        $scope.isSaving[propertyName] = false;
                        $scope.isSaved[propertyName] = false;
                    });
                }

                MenuService.getMenuItem($stateParams.menuItemId).then(function (menuItem) {
                    $scope.selectedMenuItem = menuItem;
                    savedMenuItem = angular.copy($scope.selectedMenuItem);
                });

                $scope.saveSelectedMenuItem = function(propertyName) {
                    if (shouldSaveSelectedMenuItemProperty(propertyName)) {
                        saveSelectedMenuItemProperty(propertyName);
                    }
                };

                $scope.focus = FocusService.focusElementWithId;

                $scope.createNewPage = function () {
                    $state.go('menu-item.add-page', { menuItemId: $stateParams.menuItemId });
                };
            }
        ]);
}());
