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

import ChannelSidenavService from './sidenav.service';
import ChannelSidenavToggleCtrl from './toggle.controller';
import channelSidenavToggleDirective from './toggle.directive';
import ChannelSidenavCtrl from './sidenav.controller';
import channelSidenavDirective from './sidenav.directive';
import CatalogComponentDirective from './catalog.component.directive';

const channelSidenavModule = angular
  .module('hippo-cm.channel.sidenav', [])
  .service('ChannelSidenavService', ChannelSidenavService)
  .controller('ChannelSidenavToggleCtrl', ChannelSidenavToggleCtrl)
  .directive('channelSidenavToggle', channelSidenavToggleDirective)
  .controller('ChannelSidenavCtrl', ChannelSidenavCtrl)
  .directive('catalogComponent', CatalogComponentDirective)
  .directive('channelSidenav', channelSidenavDirective);

export default channelSidenavModule;
