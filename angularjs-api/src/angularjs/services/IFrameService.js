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

(function () {
  "use strict";

  var LIVE_RELOAD_URL = '//localhost:35729/livereload.js';

  angular.module('hippo.channel')

    .service('_hippo.channel.IFrameService', [
      '$window', '$log', function ($window, $log) {
        var iframePanelId = getParentIFramePanelId(),
          isActive = iframePanelId !== null;

        function getParentIFramePanelId () {
          var idParam = 'parentExtIFramePanelId',
            search = $window.location.search,
            parameters, i, length, keyValue;

          if (search.length > 0) {
            parameters = search.substring(1).split('&');

            for (i = 0, length = parameters.length; i < length; i++) {
              keyValue = parameters[i].split('=');
              if (keyValue[0] === idParam) {
                return keyValue[1];
              }
            }
          }

          return null;
        }

        function getParentIFramePanel () {
          var iframePanel = $window.parent.Ext.getCmp(iframePanelId);

          if (!angular.isObject(iframePanel)) {
            throw new Error("Unknown iframe panel id: '" + iframePanelId + "'");
          }

          return iframePanel;
        }

        function publish (event, value1, value2) {
          if (isActive) {
            return getParentIFramePanel().iframeToHost.publish(event, value1, value2);
          }
        }

        function subscribe (event, callback, scope) {
          if (isActive) {
            return getParentIFramePanel().hostToIFrame.subscribe(event, callback, scope);
          }
        }

        function getConfig () {
          if (isActive) {
            var iframePanel = getParentIFramePanel(),
              config = iframePanel.initialConfig.iframeConfig;

            if (config === undefined) {
              throw new Error("Parent iframe panel does not contain iframe configuration");
            }

            return config;
          } else {
            return {};
          }
        }

        function addScriptToHead (scriptUrl) {
          var head = $window.document.getElementsByTagName("head")[0],
            script = document.createElement('script');
          script.type = 'text/javascript';
          script.src = scriptUrl;
          head.appendChild(script);
        }

        function enableLiveReload () {
          if (getConfig().debug) {
            addScriptToHead(LIVE_RELOAD_URL);
            $log.info("iframe #" + getParentIFramePanelId() + " has live reload enabled via " + LIVE_RELOAD_URL);
          }
        }

        return {
          isActive: isActive,
          getConfig: getConfig,
          enableLiveReload: enableLiveReload,
          publish: publish,
          subscribe: subscribe
        };
      }
    ]);
}());
