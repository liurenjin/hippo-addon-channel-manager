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

import ChannelSidePanelService from './sidePanel.service';
import channelLeftSidePanelToggleComponentModule from './leftSidePanel/leftSidePanelToggle.component';
import channelLeftSidePanelComponentModule from './leftSidePanel/leftSidePanel.component';
import channelRightSidePanelComponentModule from './rightSidePanel/rightSidePanel.component';

const channelSidePanelModule = angular
  .module('hippo-cm.channel.sidePanel', [
    channelLeftSidePanelToggleComponentModule.name,
    channelLeftSidePanelComponentModule.name,
    channelRightSidePanelComponentModule.name,
  ])
  .service('ChannelSidePanelService', ChannelSidePanelService);

export default channelSidePanelModule;