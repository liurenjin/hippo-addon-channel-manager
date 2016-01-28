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

describe('ConfigService', function () {
  'use strict';

  var ConfigService;

  beforeEach(function () {
    window.APP_CONFIG.locale = 'nl';
    window.APP_CONFIG.apiUrlPrefix = 'https://127.0.0.1:9080/web/one/two';

    module('hippo-cm-api');

    inject(function (_ConfigService_) {
      ConfigService = _ConfigService_;
    });
  });

  it('allows custom configuration passed in by the CmsService', function () {
    expect(ConfigService.locale).toEqual('nl');
    expect(ConfigService.apiUrlPrefix).toEqual('https://127.0.0.1:9080/web/one/two');
  });
});
