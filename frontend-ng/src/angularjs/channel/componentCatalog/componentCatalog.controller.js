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

class ComponentCatalogController {
  constructor(MaskService, HippoIframeService, OverlayService) {
    'ngInject';

    this.MaskService = MaskService;
    this.HippoIframeService = HippoIframeService;
    this.OverlayService = OverlayService;
  }

  onSelect(index) {
    this.HippoIframeService.liftIframeAboveMask();
    this.OverlayService.mask();

    this.MaskService.mask(() => {
      this.HippoIframeService.lowerIframeBeneathMask();
      this.OverlayService.unmask();
      this.MaskService.unmask();
    });

    this.selectedComponentIndex = index;
  }

  isComponentSelected(index) {
    const isMasked = this.MaskService.isMasked();
    const selected = this.selectedComponentIndex === index;
    return selected && isMasked;
  }
}

export default ComponentCatalogController;
