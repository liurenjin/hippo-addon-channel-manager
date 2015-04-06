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

  angular.module('hippo.channel.pages')

    .controller('hippo.channel.pages.AddPageCtrl', [
      '$scope',
      '$filter',
      'hippo.channel.FeedbackService',
      'hippo.channel.PrototypeService',
      'hippo.channel.PageService',
      'hippo.channel.Container',
      'lowercaseFilter',
      'hippoChannelAlphanumericFilter',
      function ($scope, $filter, FeedbackService, PrototypeService, PageService, ContainerService, lowercaseFilter, alphanumericFilter) {
        var updateURLAutomatically = true,
          translate = $filter('translate');

        $scope.page = {
          title: '',
          url: '',
          prototype: {}
        };

        $scope.validation = {
          illegalCharacters: '/ :'
        };

        $scope.host = '';
        $scope.mountPath = '';
        $scope.prototypes = [];

        $scope.tooltips = {
          url: function () {
            if ($scope.form.$dirty) {
              if ($scope.form.url.$error.required) {
                return translate('URL_REQUIRED');
              } else if ($scope.form.url.$error.illegalCharacters) {
                return translate('ILLEGAL_CHARACTERS', $scope.validation);
              }
            }
            return '';
          }
        };

        $scope.submit = function () {
          var pageModel = {
            pageTitle: $scope.page.title,
            name: $scope.page.url,
            componentConfigurationId: $scope.page.prototype.id
          };

          PageService.createPage(pageModel).then(function () {
            ContainerService.showPage($scope.mountPath + '/' + pageModel.name);
          }, function (errorResponse) {
            $scope.errorFeedback = FeedbackService.getFeedback(errorResponse);
          });
        };

        // fetch prototypes
        PrototypeService.getPrototypes().then(function (data) {
          $scope.prototypes = data.prototypes;
          $scope.locations = data.locations;
          $scope.page.prototype = data.prototypes[0];
        }, function (errorResponse) {
          $scope.errorFeedback = FeedbackService.getFeedback(errorResponse);
        });

        // fetch host
        PageService.getMountInfo().then(function (mountInfo) {
          $scope.mountPath = mountInfo.mountPath;
          $scope.host = mountInfo.hostName + mountInfo.mountPath;
        }, function (errorResponse) {
          $scope.errorFeedback = FeedbackService.getFeedback(errorResponse);
        });

        // update url according to page title
        $scope.$watch('page.title', function (value) {
          if (updateURLAutomatically) {
            $scope.page.url = alphanumericFilter(lowercaseFilter(value));
          }
        });

        $scope.disableAutomaticUrlUpdate = function () {
          updateURLAutomatically = false;
        };
      }
    ]);
})();
