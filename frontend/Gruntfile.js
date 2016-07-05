/*
 * Copyright 2014-2016 Hippo B.V. (http://www.onehippo.com)
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

module.exports = function (grunt) {
  'use strict';

  // display execution time of each task
  require('time-grunt')(grunt);

  // load all grunt tasks automatically
  require('load-grunt-tasks')(grunt);

  // project configuration
  grunt.initConfig({
    build: require('./build.config.js'),

    // watch source files and rebuild when they change
    watch: {
      options: {
        spawn: false,
        interrupt: true,
        livereload: true
      },

      apps: {
        files: [
          '<%= build.ngsource %>/**/*'
        ],
        tasks: ['build']
      },

      /*
       * When the Sass files change, we need to compile them, prefix css rules,
       * lint the resulting css and provide dist files.
       */
      sass: {
        files: ['<%= build.sass %>'],
        tasks: ['sass', 'autoprefixer', 'concat:css']
      },

      extjs: {
        files: ['src/main/resources/**/*.{html,js,css,png,svg}'],
        tasks: ['newer:copy:extjs']
      }
    },

    // clean target (distribution) folder
    clean: {
      target: {
        src: '<%= build.ngtarget %>'
      }
    },

    // Compile Sass to CSS.
    sass: {
      menu: {
        files: {
          '<%= build.ngtarget %>/menu/assets/css/menu.css': '<%= build.ngsource %>/menu/assets/styles/menu.scss'
        }
      }
    },


    /*
     * Autoprefixer scans the css for rules that need vendor specific prefixes
     * like -moz-, -webkit-, -ms- or -o-. These are needed for some css features
     * to work in older browsers. The supported browsers are listed in the browsers option.
     */
    autoprefixer: {
      options: {
        browsers: ['last 1 Chrome versions', 'last 1 Firefox versions', 'Safari >= 7', 'Explorer >= 10'],
        map: true
      },
      menu: {
        src: '<%= build.ngtarget %>/menu/assets/css/menu.css',
        dest: '<%= build.ngtarget %>/menu/assets/css/menu.css'
      }
    },

    // copy files to target folder
    copy: {
      apps: {
        files: [
          {
            expand: true,
            cwd: '<%= build.ngsource %>',
            dest: '<%= build.ngtarget %>',
            src: [
              '**/*.html',
              '**/*.js',
              '!**/*.spec.js',
              '**/assets/css/*',
              '!**/assets/styles/*',
              '**/assets/images/*',
              '**/i18n/*.json'
            ]
          }
        ]
      },

      components: {
        files: [
          {
            expand: true,
            cwd: '<%= build.npmDir %>',
            dest: '<%= build.ngtarget %>/components',
            src: [
              'angular/angular.min.js',
              'angular/angular.min.js.map',
              'angular-ui-bootstrap/ui-bootstrap-tpls.min.js',
              'angular-chosen-localytics/dist/angular-chosen.min.js',
              'angular-translate/dist/angular-translate.min.js',
              'angular-translate-loader-static-files/angular-translate-loader-static-files.min.js',
              'angular-ui-router/release/angular-ui-router.min.js',
              'angular-ui-tree/dist/angular-ui-tree.min.js',
              'angular-tablesort/js/angular-tablesort.js',
              'angular-animate/angular-animate.min.js',
              'angular-aria/angular-aria.min.js',
              'chosen-npm/public/chosen.jquery.min.js',
              'google-code-prettify/src/prettify.js',
              'hippo-theme/dist/css/main.min.css',
              'hippo-theme/dist/js/main.min.js',
              'hippo-theme/dist/images/*',
              'hippo-theme/dist/fonts/*',
              'hippo-addon-channel-manager-angularjs-api/dist/css/main.min.css',
              'hippo-addon-channel-manager-angularjs-api/dist/js/main.min.js',
              'hippo-addon-channel-manager-angularjs-api/dist/images/*',
              'hippo-addon-channel-manager-angularjs-api/dist/fonts/*',
              'jquery/dist/jquery.min.js',
              'jquery/dist/jquery.min.map',
              'underscore/underscore-min.js',
            ]
          }
        ]
      },

      extjs: {
        files: [
          {
            expand: true,
            cwd: '<%= build.extjssource %>',
            src: ['**/*.{html,js,css,png,svg}'],
            dest: '<%= build.extjstarget %>'
          }
        ]
      }
    },

    // add hashes to file names to avoid caching issues
    filerev: {
      css: {
        src: '<%= build.ngtarget %>/**/*.css'
      },
      js: {
        src: '<%= build.ngtarget %>/**/*.js'
      },
      images: {
        src: '<%= build.ngtarget %>/**/*.{gif,png}'
      }
    },

    // replace file references in HTML files with their hashed versions
    usemin: {
      css: '<%= build.ngtarget %>/**/*.css',
      html: '<%= build.ngtarget %>/**/*.html'
    },

    // validate source code with jslint
    jshint: {
      options: {
        reporter: require('jshint-stylish'),
        jshintrc: true
      },
      apps: [
        '<%= build.ngsource %>/**/*.js',
        '!<%= build.ngsource %>/**/*.spec.js'
      ],
      tests: [
        '<%= build.ngsource %>/**/*.spec.js'
      ]
    },

    // testing with karma
    karma: {
      options: {
        configFile: 'karma.config.js',
        autoWatch: true
      },

      single: {
        singleRun: true
      },

      continuous: {
        singleRun: false
      }
    }
  });

  grunt.registerTask('default', 'Build and test', [
    'build',
    'test'
  ]);

  grunt.registerTask('build', 'Build everything', [
    'jshint:apps',
    'clean',
    'sass',
    'autoprefixer',
    'copy',
    'filerev',
    'usemin'
  ]);

  grunt.registerTask('test', 'Test the source code', [
    'jshint:tests',
    'karma:single'
  ]);

  grunt.registerTask('test:continuous', 'Test the source code continuously', [
    'jshint:tests',
    'karma:continuous'
  ]);
};
