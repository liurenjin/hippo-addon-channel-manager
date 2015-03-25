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

    angular.module('hippo.channel.menu')
        .controller('hippo.channel.menu.PickerCtrl', [
            '$state',
            '$stateParams',
            'hippo.channel.menu.PickerService',
            function ($state, $stateParams, PickerService) {
                var PickerCtrl = this;
                PickerCtrl.selectDocument = function() {
                    $state.go('menu-item.edit', {
                        menuItemId: $stateParams.menuItemId,
                        selectedDocumentPath: PickerCtrl.selectedDocument.pathInfo
                    });
                };
                PickerCtrl.cancelPicker = function() {
                    $state.go('menu-item.edit', {
                        menuItemId: $stateParams.menuItemId
                    });
                };
                PickerCtrl.treeItems = PickerService.getTree();
                PickerCtrl.pickerTypes = [
                    {
                        name: 'Documents'
                    },
                    {
                        name: 'Pages'
                    }
                ];
                PickerCtrl.pickerType = PickerCtrl.pickerTypes[0];
                PickerCtrl.selectedDocument = null;

                if($stateParams.link) {
                    PickerService.getInitialData($stateParams.siteContentIdentifier, $stateParams.link).then(function() {
                        navigateToSelected(PickerCtrl.treeItems);
                        function navigateToSelected(items, parent) {
                            angular.forEach(items, function (item) {
                                if (item.selected) {
                                    $state.go('picker.docs', {
                                        pickerTreeItemId: parent.id
                                    });
                                    PickerCtrl.selectedItem = parent;
                                    PickerCtrl.selectedDocument = item;
                                }
                                if(item.items) {
                                    navigateToSelected(item.items, item);
                                }
                            });
                        }
                    });
                } else {
                    PickerService.getInitialData($stateParams.siteContentIdentifier);

                }

            }
        ]);
}());
