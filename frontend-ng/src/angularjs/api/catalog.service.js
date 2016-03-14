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

export class CatalogService {
  constructor(HstService) {
    'ngInject';

    this.HstService = HstService;
    this.components = [];
  }

  load(mountId) {
    return this.HstService.doGet(mountId, 'toolkit')
      .then((response) => {
        if (response && response.data) {
          let components = response.data;
          components.sort((a, b) => a.label.localeCompare(b.label));
          this.components = components;
        }
        // TODO: handle error?
      });
  }

  getComponents() {
    return this.components;
  }

  setCatalogElement(component, jQueryElement) {
    component.catalogJQueryElement = jQueryElement;
  }

  getComponentByDomElement(domElement) {
    return this.components.find((component) => component.catalogJQueryElement[0] === domElement);
  }
}
