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

    .controller('hippo.channel.menu.PickerDocCtrl', [
      '$scope',
      '$state',
      '$stateParams',
      '$filter',
      function ($scope, $state, $stateParams, $filter) {
        var PickerDocCtrl = this;
        PickerDocCtrl.selectedItem = $filter('hippoGetByProperty')($scope.PickerCtrl.treeItems, 'id', $stateParams.pickerTreeItemId, 'items');

        PickerDocCtrl.selectDocument = function (item) {
          $scope.PickerCtrl.selectedDocument = item;
        };
      }
    ]);
}());