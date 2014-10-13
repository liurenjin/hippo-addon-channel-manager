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

module.exports = function(config) {

    var build = require( './build.config.js' );

    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: build.source,

        // frameworks to use
        frameworks: ['jasmine'],

        // list of files / patterns to load in the browser
        files: [
            // dependencies
            'components/jquery/dist/jquery.js',
            'components/underscore/underscore.js',
            'components/angular/angular.js',
            'components/angular-bootstrap/ui-bootstrap.min.js',
            'components/angular-route/angular-route.js',
            'components/hippo-theme/dist/js/main.js',
            'components/angular-translate/angular-translate.js',
            'components/angular-translate-loader-static-files/angular-translate-loader-static-files.js',
            'components/angular-ui-router/release/angular-ui-router.min.js',
            'components/angular-ui-tree/dist/angular-ui-tree.js',

            // testing dependencies
            'components/jasmine-jquery/lib/jasmine-jquery.js',
            'components/angular-mocks/angular-mocks.js',

            // shared sources
            'shared/shared-dependencies.js',
            'shared/services/*.js',
            'shared/filters/**/*.js',
            'shared/directives/**/*.js',

            // apps sources
            'menu/menu-dependencies.js',
            'menu/services/*.js',
            'menu/states/**/*.js',

            'page/page-dependencies.js',
            'page/states/**/*.js',

            'pages/pages-dependencies.js',
            'pages/filters/*.js',
            'pages/states/**/*.js',

            // tests
            {
                pattern: '**/*.spec.js',
                included: false
            }
        ],

        // list of files to exclude
        exclude: [],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters: ['dots','junit'],

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
            'menu/**/!(*spec).js': ['coverage'],
            'page/**/!(*spec).js': ['coverage'],
            'pages/**/!(*spec).js': ['coverage'],
            'shared/**/!(*spec).js': ['coverage']
        },

        junitReporter: {
            outputFile: '../target/surefire-reports/TEST-karma-results.xml'
        }

    });
};
