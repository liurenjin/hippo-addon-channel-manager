/*
 * Copyright 2016 Hippo B.V. (http://www.onehippo.com)
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

import { DomService } from './dom.service';
import { ThrottleService } from './throttle.service';
import { FeedbackService } from './feedback.service';
import { PathService } from './path.service';
import { FormStateServiceFactory } from './formState.service';
import { startWithSlashFilter } from './filter/startWithSlash.filter';
import { getByPropertyFilter } from './filter/getByProperty.filter';
import { illegalCharactersDirective } from './directive/illegalCharacters.directive';
import { stopPropagationDirective } from './directive/stopPropagation.directive';

export const utilsModule = angular
  .module('hippo-cm.utils', [])
  .service('DomService', DomService)
  .service('ThrottleService', ThrottleService)
  .service('FeedbackService', FeedbackService)
  .service('PathService', PathService)
  .filter('getByProperty', getByPropertyFilter)
  .filter('startWithSlash', startWithSlashFilter)
  .directive('illegalCharacters', illegalCharactersDirective)
  .directive('stopPropagation', stopPropagationDirective)
  .factory('FormStateService', FormStateServiceFactory);
