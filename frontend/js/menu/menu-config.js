/*
 * Copyright 2014-2015 Hippo B.V. (http://www.onehippo.com)
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
(function() {
    "use strict";

    angular.module('hippo.channel.menu')

        .config([
            '$stateProvider',
            '$translateProvider',
            '$tooltipProvider',
            function($stateProvider, $translateProvider, $tooltipProvider) {

                // routing
                $stateProvider
                    .state('loader', {
                        url: '/loader',
                        controller: 'hippo.channel.menu.LoaderCtrl',
                        templateUrl: 'states/loader/loader.html'
                    })

                    .state('menu-item', {
                        abstract: true,
                        controller: 'hippo.channel.menu.MenuItemCtrl',
                        templateUrl: 'states/menu-item/menu-item.html'
                    })

                    .state('menu-item.edit', {
                        url: '/:menuItemId/edit',
                        controller: 'hippo.channel.menu.EditMenuItemCtrl',
                        templateUrl: 'states/menu-item/edit/edit-menu-item.html'
                    })

                    .state('menu-item.none', {
                        url: '/none',
                        controller: 'hippo.channel.menu.NoMenuItemCtrl'
                    });


                // translations
                $translateProvider.useStaticFilesLoader({
                    prefix: 'i18n/',
                    suffix: '.json'
                });

                // tooltips
                $tooltipProvider.options({
                    animation: false
                });
                $tooltipProvider.setTriggers({
                    'show': 'hide'
                });
            }
        ]
    );

}());
