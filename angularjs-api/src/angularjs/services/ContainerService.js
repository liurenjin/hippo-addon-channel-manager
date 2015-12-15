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

    function prefixWithSlash(str) {
        if (str === '' || str.charAt(0) !== '/') {
            return '/' + str;
        }
        return str;
    }

    angular.module('hippo.channel')

        .service('hippo.channel.Container', [
            '$log',
            '$rootScope',
            '_hippo.channel.IFrameService',
            'hippo.channel.FormStateService',
            function($log, $rootScope, IFrameService, FormStateService) {

                function performClose() {
                    IFrameService.publish('close-reply');
                }

                function handleClose() {
                    if (IFrameService.isActive) {

                        IFrameService.subscribe('close-request', function() {

                            $rootScope.$broadcast('container:before-close');

                            var closeEvent = $rootScope.$broadcast('container:close');
                            if (!closeEvent.defaultPrevented) {
                                performClose();
                            }
                        });

                        $rootScope.$on('container:close', function(event) {
                            if (!FormStateService.isValid()) {
                                event.preventDefault();
                                $rootScope.$broadcast('close-confirmation:show');
                            }
                        });
                    }
                }

                function showPage(path, mountId) {
                    IFrameService.publish('browseTo', prefixWithSlash(path), mountId);
                }

                return {
                    handleClose: handleClose,
                    performClose: performClose,
                    showPage: showPage
                };
            }
        ]);
}());
