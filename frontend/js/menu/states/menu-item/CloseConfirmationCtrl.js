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
    'use strict';

    angular.module('hippo.channel.menu')

        .controller('hippo.channel.menu.CloseConfirmationCtrl', [
            '$scope',
            '$rootScope',
            'hippo.channel.Container',
            function ($scope, $rootScope, ContainerService) {
                // default visibility of the dialog
                $scope.dialog = {
                    visible: false
                };

                // the message is supposed to come from the ContainerService, that handles
                // the communication with the iFrame
                $rootScope.$on('close-confirmation:show', function () {
                    $scope.$apply(function () {
                        $scope.dialog.visible = true;
                    });
                });

                // confirm - close the panel
                $scope.confirm = function () {
                    ContainerService.performClose();
                };

                // cancel - hide the dialog
                $scope.cancel = function () {
                    $scope.dialog.visible = false;
                };
            }
        ]);
})();