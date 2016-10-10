/*
 * Copyright 2015-2016 Hippo B.V. (http://www.onehippo.com)
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

import angular from 'angular';
import ngMaterial from 'angular-material';
import ngTranslate from 'angular-translate';
import 'angular-translate-loader-static-files';
import uiRouter from 'angular-ui-router';

import { channelManagerApi } from './api/api';
import { channelModule } from './channel/channel';
import { config } from './hippo-cm.config';

export const hippoCmng = angular
  .module('hippo-cm', [
    ngMaterial,
    ngTranslate,
    uiRouter,
    channelManagerApi.name,
    channelModule.name,
  ])
  .config(config);
