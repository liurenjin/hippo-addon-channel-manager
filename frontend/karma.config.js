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

module.exports = function karmaConfig(config) {

  var build = require('./build.config.js');

  config.set({

    // frameworks to use
    frameworks: ['jasmine'],

    // list of files / patterns to load in the browser
    files: [

      // dependencies
      build.bower + '/jquery/dist/jquery.js',
      build.bower + '/angular/angular.js',
      build.bower + '/angular-bootstrap/ui-bootstrap.min.js',
      build.bower + '/hippo-theme/dist/js/main.js',
      build.bower + '/angular-translate/angular-translate.js',
      build.bower + '/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
      build.bower + '/angular-ui-router/release/angular-ui-router.min.js',
      build.bower + '/angular-ui-tree/dist/angular-ui-tree.js',
      build.bower + '/angular-chosen-localytics/chosen.js',
      build.bower + '/angular-aria/angular-aria.js',
      build.bower + '/hippo-addon-channel-manager-angularjs-api/dist/js/main.min.js',

      // testing dependencies
      build.bower + '/jasmine-jquery/lib/jasmine-jquery.js',
      build.bower + '/angular-mocks/angular-mocks.js',

      // apps sources
      build.ngsource + '/shared/services/ChannelService.js',
      build.ngsource + '/shared/services/PageService.js',

      build.ngsource + '/menu/menu-dependencies.js',
      build.ngsource + '/menu/services/*.js',
      build.ngsource + '/menu/states/**/*.js',

      build.ngsource + '/page/page-dependencies.js',
      build.ngsource + '/page/filters/*.js',
      build.ngsource + '/page/states/**/*.js',

      build.ngsource + '/pages/pages-dependencies.js',
      build.ngsource + '/pages/filters/*.js',
      build.ngsource + '/pages/states/**/*.js',

      // tests
      {
        pattern: build.ngsource + '/**/*.spec.js',
        included: false,
      },
    ],

    // list of files to exclude
    exclude: [],

    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['dots', 'junit'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],

    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,

    // Continuous Integration mode
    // if true, it captures browsers, runs tests and exits
    singleRun: false,

    preprocessors: {
      '<%= build.ngsource %>/menu/**/!(*spec).js': ['coverage'],
      '<%= build.ngsource %>/page/**/!(*spec).js': ['coverage'],
      '<%= build.ngsource %>/pages/**/!(*spec).js': ['coverage'],
    },

    junitReporter: {
      outputDir: './target/surefire-reports/',
      outputFile: 'TEST-karma-results.xml',
    },
  });
};
