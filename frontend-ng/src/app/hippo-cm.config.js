/*
 * Copyright 2015-2017 Hippo B.V. (http://www.onehippo.com)
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

import template from './hippo-cm.html';

function config(
  $compileProvider,
  $mdIconProvider,
  $mdThemingProvider,
  $stateProvider,
  $translateProvider,
  $urlRouterProvider,
) {
  'ngInject';

  $urlRouterProvider.otherwise('/');

  // TODO: Switch to component router
  $stateProvider.state('hippo-cm', {
    url: '/',
    template,
    resolve: {
      translations: ($translate, ConfigService) => {
        'ngInject';

        $translateProvider.useStaticFilesLoader({
          prefix: 'i18n/',
          suffix: `.json?antiCache=${ConfigService.antiCache}`,
        });
        return $translate.use(ConfigService.locale || $translate.fallbackLanguage())
          .catch(() => $translate.use($translate.fallbackLanguage()));
      },
    },
  });

  $translateProvider
    .registerAvailableLanguageKeys(['en', 'nl', 'fr', 'de', 'es', 'zh'], {
      'en_*': 'en',
      'nl_*': 'nl',
      'fr_*': 'fr',
      'de_*': 'de',
      'es_*': 'es',
      'zh_*': 'zh',
    });
  $translateProvider.fallbackLanguage('en');
  $translateProvider.useSanitizeValueStrategy('escaped');

  $mdThemingProvider.definePalette('hippo-blue', {
    50: '#cfe7fc',
    100: '#94c9f7',
    200: '#5faff5',
    300: '#3399f2',
    400: '#1785e6',
    500: '#0877d1',
    600: '#0465ba',
    700: '#0259a6',
    800: '#024e96',
    900: '#004280',
    A100: '#99cfff',
    A200: '#4da0ff',
    A400: '#267dff',
    A700: '#0357ff',
    contrastDefaultColor: 'light',
    contrastDarkColors: ['50', '100', '200', '300', '400', 'A100'],
  });

  $mdThemingProvider.definePalette('hippo-orange', {
    50: '#fce1cf',
    100: '#f7ba94',
    200: '#f59356',
    300: '#f58133',
    400: '#f26f18',
    500: '#e35c09',
    600: '#d15102',
    700: '#bd4a02',
    800: '#A84202',
    900: '#963c00',
    A100: '#ffc099',
    A200: '#ff9659',
    A400: '#ff751a',
    A700: '#e06717',
    contrastDefaultColor: 'light',
    contrastDarkColors: ['50', '100', '200', '300', '400', 'A100'],
  });

  $mdThemingProvider.definePalette('hippo-red', {
    50: '#fccfcf',
    100: '#fc8c8c',
    200: '#fa5151',
    300: '#f22a2a',
    400: '#e61717',
    500: '#d40d0d',
    600: '#BD0606',
    700: '#ab0303',
    800: '#990202',
    900: '#850000',
    A100: '#ff9999',
    A200: '#ff596a',
    A400: '#ff334e',
    A700: '#f70029',
    contrastDefaultColor: 'light',
    contrastDarkColors: ['50', '100', '200', '300', '400', 'A100'],
  });

  $mdThemingProvider.definePalette('hippo-grey', {
    50: '#ffffff',
    100: '#f4f4f5',
    200: '#e8e8ea',
    300: '#d9d9dd',
    400: '#b8bcbf',
    500: '#92a0a5',
    600: '#697279',
    700: '#39434c',
    800: '#22272f',
    900: '#000000',
    A100: '#ffffff',
    A200: '#000000',
    A400: '#303030',
    A700: '#39434c',
    contrastDefaultColor: 'dark',
    contrastLightColors: ['500', '600', '700', '800', '900', 'A200', 'A400', 'A700'],
  });

  $mdThemingProvider.theme('default')
    .primaryPalette('hippo-blue')
    .accentPalette('hippo-orange')
    .warnPalette('hippo-red')
    .backgroundPalette('hippo-grey');

  const HippoGlobal = window.parent.Hippo || {};
  const antiCache = HippoGlobal.antiCache ? `?antiCache=${window.top.Hippo.antiCache}` : '';

  $mdIconProvider
    .icon('any-device', `images/any-device.svg${antiCache}`)
    .icon('attention', `images/attention.svg${antiCache}`)
    .icon('back', `images/back.svg${antiCache}`)
    .icon('close', `images/close.svg${antiCache}`)
    .icon('desktop', `images/desktop.svg${antiCache}`)
    .icon('document-status-changed', `images/document-status-changed.svg${antiCache}`)
    .icon('document-status-live', `images/document-status-live.svg${antiCache}`)
    .icon('document-status-new', `images/document-status-new.svg${antiCache}`)
    .icon('document', `images/document.svg${antiCache}`)
    .icon('folder-closed', `images/folder-closed.svg${antiCache}`)
    .icon('folder-open', `images/folder-open.svg${antiCache}`)
    .icon('left-side-panel-arrow-left', `images/left-side-panel-arrow-left.svg${antiCache}`)
    .icon('left-side-panel-arrow-right', `images/left-side-panel-arrow-right.svg${antiCache}`)
    .icon('maximize-sidepanel', `images/maximize-sidepanel.svg${antiCache}`)
    .icon('phone', `images/phone.svg${antiCache}`)
    .icon('publish', `images/publish.svg${antiCache}`)
    .icon('resize-handle', `images/resize-handle.svg${antiCache}`)
    .icon('switch-to-content-editor', `images/switch-to-content-editor.svg${antiCache}`)
    .icon('tablet', `images/tablet.svg${antiCache}`)
    .icon('toggle_components_overlay', `images/toggle_components_overlay.svg${antiCache}`)
    .icon('un-maximize-sidepanel', `images/un-maximize-sidepanel.svg${antiCache}`);

  // only enable Angular debug information when the CMS runs in 'Wicket development mode'
  const devMode = angular.element(window.parent.document.documentElement).hasClass('wicket-development-mode');
  $compileProvider.debugInfoEnabled(devMode);
}

export default config;
