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
            '$log',
            'hippo.channelManager.menuManager.MenuService',
            'hippo.channelManager.menuManager.FocusService',
            'hippo.channelManager.menuManager.FeedbackService',
            function ($scope, $stateParams, $state, $log, MenuService, FocusService, FeedbackService) {
                var savedMenuItem;

                $scope.isSaving = {
                    title: false,
                    linkType: false,
                    link: false
                };

                $scope.isSaved = {
                    title: true,
                    linkType: true,
                    link: true
                };

                $scope.confirmation = {
                    isVisible: false
                };

                $scope.feedback = {
                };

                $scope.focus = FocusService.focusElementWithId;

                savedMenuItem = angular.copy($scope.selectedMenuItem);

                function shouldSaveSelectedMenuItemProperty(propertyName) {
                    if (!angular.isDefined($scope.selectedMenuItem)) {
                        return false;
                    }

                    return $scope.selectedMenuItem[propertyName] !== savedMenuItem[propertyName];
                }

                function saveSelectedMenuItemProperty(propertyName) {
                    savedMenuItem = angular.copy($scope.selectedMenuItem);

                    var itemToSave = angular.copy(savedMenuItem);
                    itemToSave.name = itemToSave.title;
                    itemToSave.children = itemToSave.items;
                    delete itemToSave.title;
                    delete itemToSave.items;

                    $scope.isSaving[propertyName] = true;

                    $log.info('menu service save');
                    MenuService.saveMenuItem(itemToSave).then(function () {
                            $log.info('after save - success');
                            $scope.isSaving[propertyName] = false;
                            $scope.isSaved[propertyName] = true;
                        },
                        function (errorResponse) {
                            $log.info('after save - error');
                            $scope.feedback = FeedbackService.getFeedback(errorResponse);
                            $scope.isSaving[propertyName] = false;
                            $scope.isSaved[propertyName] = false;
                        }
                    );
                }

                $scope.saveSelectedMenuItem = function(propertyName) {
                    if (shouldSaveSelectedMenuItemProperty(propertyName)) {
                        saveSelectedMenuItemProperty(propertyName);
                    }
                };
                
                $scope.createNewPage = function () {
                    $state.go('menu-item.add-page', { menuItemId: $stateParams.menuItemId });
                };

                $scope.remove = function () {
                    // hide confirmation dialog
                    $scope.confirmation.isVisible = false;

                    // remove menu item from the DOM
                    var parentScope = $scope.findParent($scope.selectedMenuItem.id);
                    var index = $.inArray($scope.selectedMenuItem, parentScope.items);
                    if (index > -1) {
                        parentScope.items.splice(index, 1)[0];
                    }

                    // HTTP-request to delete the menu item
                    MenuService.deleteMenuItem($scope.selectedMenuItem.id).then(function (selectedMenuItemId) {
                        $state.go('menu-item.edit', {
                            menuItemId: selectedMenuItemId
                        });
                    }, function (error) {
                        // TODO show error in UI
                        $log.error(error);
                    });
                };
            }
        ]);
}());
