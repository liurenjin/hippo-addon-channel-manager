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

class ComponentCatalogService {
  constructor(
      $log,
      ChannelSidenavService,
      HippoIframeService,
      MaskService,
      OverlayService,
      PageStructureService
    ) {
    'ngInject';

    this.$log = $log;

    this.ChannelSidenavService = ChannelSidenavService;
    this.HippoIframeService = HippoIframeService;
    this.MaskService = MaskService;
    this.OverlayService = OverlayService;
    this.PageStructureService = PageStructureService;
  }

  selectComponent(component) {
    this.MaskService.mask('mask-add-component');
    this.ChannelSidenavService.liftSidenavAboveMask();
    this.HippoIframeService.liftIframeAboveMask();
    this.OverlayService.enableAddMode();

    this.OverlayService.onContainerClick((target) => {
      this.addComponentToContainer(component, target);
    });

    this.MaskService.onClick(() => {
      this.MaskService.unmask();
      this.MaskService.removeClickHandler();
      this.OverlayService.disableAddMode();
      this.OverlayService.offContainerClick();
      this.ChannelSidenavService.lowerSidenavBeneathMask();
      this.HippoIframeService.lowerIframeBeneathMask();
    });
  }

  addComponentToContainer(component, target) {
    const container = this.PageStructureService.getContainerByOverlayElement(target);

    this.PageStructureService.addComponentToContainer(component, container).then((newComponent) => {
      if (this.PageStructureService.containsNewHeadContributions(newComponent.getContainer())) {
        this.$log.info(`New '${newComponent.getLabel()}' component needs additional head contributions, reloading page`);
        this.HippoIframeService.reload().then(() => {
          this.PageStructureService.showComponentProperties(newComponent);
        });
      } else {
        this.PageStructureService.showComponentProperties(newComponent);
      }
    });
  }
}

export default ComponentCatalogService;
