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

import { channelManagerApi } from './api/api.js';
import { channelModule } from './channel/channel.js';

function translations ($translate, ConfigService) {
  return $translate.use(ConfigService.locale)
    .catch(function () {
      $translate.use($translate.fallbackLanguage());
    });
}

function config ($stateProvider, $urlRouterProvider, $translateProvider) {
  $urlRouterProvider.otherwise('/');

  $stateProvider.state('hippo-cm', {
    url: '/',
    templateUrl: 'hippo-cm.html',
    resolve: {
      translations: translations
    },
    abstract: true
  });

  // translations
  $translateProvider.useStaticFilesLoader({
    prefix: 'i18n/hippo-cm.',
    suffix: '.json'
  });
  $translateProvider.fallbackLanguage('en');
  $translateProvider.useSanitizeValueStrategy('escaped');
}

function run (CmsService) {
  CmsService.enableBrowserSync();
}

export const hippoCmModule = angular
  .module('hippo-cm', [
    'ngMaterial',
    'pascalprecht.translate',
    'ui.router',
    'hippo-cm-templates',
    channelManagerApi.name,
    channelModule.name
  ])
  .config(config)
  .run(run);


