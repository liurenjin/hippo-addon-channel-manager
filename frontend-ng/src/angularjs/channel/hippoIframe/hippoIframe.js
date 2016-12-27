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

import ngDeviceDetector from 'ng-device-detector';

import componentAdderModule from './componentAdder/componentAdder';
import hippoIframe from './hippoIframe.directive';
import HippoIframeCtrl from './hippoIframe.controller';
import HippoIframeService from './hippoIframe.service';
import HstCommentsProcessorService from './hstCommentsProcessor.service';
import LinkProcessorService from './linkProcessor.service';
import ScalingService from './scaling.service';
import ScrollService from './scroll.service';
import DragDropService from './dragDrop.service';
import ViewportService from './viewport.service';
import OverlayService from './overlay.service';

const channelHippoIframeModule = angular
  .module('hippo-cm.channel.hippoIframe', [
    ngDeviceDetector,
    componentAdderModule.name,
  ])
  .directive('hippoIframe', hippoIframe)
  .controller('hippoIframeCtrl', HippoIframeCtrl)
  .service('HippoIframeService', HippoIframeService)
  .service('hstCommentsProcessorService', HstCommentsProcessorService)
  .service('linkProcessorService', LinkProcessorService)
  .service('ScalingService', ScalingService)
  .service('ScrollService', ScrollService)
  .service('DragDropService', DragDropService)
  .service('ViewportService', ViewportService)
  .service('OverlayService', OverlayService);

export default channelHippoIframeModule;
