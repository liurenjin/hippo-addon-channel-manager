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

/* eslint-disable prefer-const */

import { HstConstants } from '../../../api/hst.constants';
import { PageStructureElement } from './pageStructureElement';

export class ContainerElement extends PageStructureElement {
  constructor(startCommentDomElement, metaData, commentProcessor) {
    let [boxDomElement, endCommentDomElement] = commentProcessor.locateComponent(metaData.uuid, startCommentDomElement);

    if (PageStructureElement.isTransparentXType(metaData)) {
      boxDomElement = startCommentDomElement.parentNode;
    }

    super('container', metaData, startCommentDomElement, endCommentDomElement, boxDomElement);

    this.items = [];
  }

  isEmpty() {
    return this.items.length === 0;
  }

  isDisabled() {
    return this.isInherited() || (this.isLocked() && !this.isLockedByCurrentUser());
  }

  isInherited() {
    return this.metaData[HstConstants.INHERITED] === 'true';
  }

  addComponent(component) {
    this.items.push(component);
    component.setContainer(this);
  }

  addComponentBefore(component, nextComponent) {
    const nextIndex = nextComponent ? this.items.indexOf(nextComponent) : -1;
    if (nextIndex > -1) {
      this.items.splice(nextIndex, 0, component);
    } else {
      this.items.push(component);
    }

    component.setContainer(this);
  }

  removeComponent(component) {
    const index = this.items.indexOf(component);
    if (index > -1) {
      this.items.splice(index, 1);
      component.setContainer(null);
    }
  }

  getComponents() {
    return this.items;
  }

  getComponent(componentId) {
    return this.items.find((item) => item.getId() === componentId);
  }

  /**
   * Remove the component identified by given Id from its container
   * @param componentId
   * @returns {*} the removed component
   */
  removeComponent(componentId) {
    const component = this.getComponent(componentId);
    if (component) {
      this.items.splice(this.items.indexOf(component), 1);
      return component;
    }

    return null;
  }

  getComponentByIframeElement(iframeElement) {
    return this.items.find((item) => item.getJQueryElement('iframe').is(iframeElement));
  }

  getHstRepresentation() {
    return {
      data: {
        id: this.getId(),
        lastModifiedTimestamp: this.getLastModified(),
        children: this.items.map((item) => item.getId()),
      },
    };
  }
}
