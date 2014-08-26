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

    angular.module('hippo.channel')

        .service('hippo.channel.ConfigService', [
            '_hippo.channel.IFrameService',
            function(IFrame) {
                var config = {
                    // default configuration for local development without cms
                    apiUrlPrefix: 'http://localhost:8080/site/_rp',
                    locale: 'en',
                    antiCache: new Date().getTime()
                };

                // override default config when app runs in iframe
                if (IFrame.isActive) {
                    config = IFrame.getConfig();
                }

                return config;
            }
        ]);
}());
