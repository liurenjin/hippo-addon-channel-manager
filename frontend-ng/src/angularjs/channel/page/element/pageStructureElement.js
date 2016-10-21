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

import HstConstants from '../../../constants/hst.constants';

class PageStructureElement {
  constructor(type, metaData, startCommentDomElement, endCommentDomElement, boxDomElement) {
    this.type = type;
    this.metaData = metaData;
    this.jQueryElements = {};
    this.headContributions = [];

    this.setStartComment($(startCommentDomElement));
    this.setEndComment($(endCommentDomElement));
    this.setBoxElement($(boxDomElement));
  }

  setJQueryElement(elementType, element) {
    this.jQueryElements[elementType] = element;
  }

  getJQueryElement(elementType) {
    return this.jQueryElements[elementType];
  }

  getId() {
    return this.metaData.uuid;
  }

  getLabel() {
    let label = this.metaData[HstConstants.LABEL];
    if (label === 'null') {
      label = this.type; // no label available, fallback to type.
    }
    return label;
  }

  getLastModified() {
    const lastModified = this.metaData[HstConstants.LAST_MODIFIED];
    return lastModified ? parseInt(lastModified, 10) : 0;
  }

  isLocked() {
    return angular.isDefined(this.getLockedBy());
  }

  getLockedBy() {
    return this.metaData[HstConstants.LOCKED_BY];
  }

  isLockedByCurrentUser() {
    return this.metaData[HstConstants.LOCKED_BY_CURRENT_USER] === 'true';
  }

  hasNoIFrameDomElement() {
    return this.metaData.hasNoDom;
  }

  getRenderUrl() {
    return this.metaData[HstConstants.RENDER_URL];
  }

  /**
   * Replace container DOM elements with the given markup
   * @return the jQuery element referring to the inserted markup in the DOM document
   */
  replaceDOM(htmlFragment) {
    const endCommentNode = this.getEndComment()[0];
    let node = this.getStartComment()[0];
    while (node && node !== endCommentNode) {
      const toBeRemoved = node;
      node = node.nextSibling;
      toBeRemoved.parentNode.removeChild(toBeRemoved);
    }

    if (!node) {
      throw new Error('Inconsistent PageStructureElement: startComment and endComment elements should be sibling');
    }

    const jQueryNodeCollection = $(htmlFragment);
    this.getEndComment().replaceWith(jQueryNodeCollection);
    return jQueryNodeCollection;
  }

  static isXTypeNoMarkup(metaData) {
    const metaDataXType = metaData[HstConstants.XTYPE];

    return metaDataXType !== undefined && metaDataXType.toUpperCase() === HstConstants.XTYPE_NOMARKUP.toUpperCase();
  }

  getStartComment() {
    return this.getJQueryElement('iframeStartComment');
  }

  setStartComment(newJQueryStartComment) {
    this.setJQueryElement('iframeStartComment', newJQueryStartComment);
  }

  getEndComment() {
    return this.getJQueryElement('iframeEndComment');
  }

  setEndComment(newJQueryEndComment) {
    this.setJQueryElement('iframeEndComment', newJQueryEndComment);
  }

  getBoxElement() {
    return this.getJQueryElement('iframeBoxElement');
  }

  setBoxElement(newJQueryBoxElement) {
    this.setJQueryElement('iframeBoxElement', newJQueryBoxElement);
  }

  getOverlayElement() {
    return this.getJQueryElement('overlay');
  }

  setOverlayElement(newJQueryOverlayElement) {
    this.setJQueryElement('overlay', newJQueryOverlayElement);
  }

  containsDomElement(domElement) {
    const endCommentNode = this.getEndComment()[0];
    let node = this.getStartComment()[0].nextSibling;
    while (node && node !== endCommentNode) {
      // IE only supports contains() for elements, which have nodeType 1
      if (node.nodeType === 1 && node.contains(domElement)) {
        return true;
      }
      node = node.nextSibling;
    }
    return false;
  }

  setHeadContributions(headContributions) {
    this.headContributions = headContributions;
  }

  getHeadContributions() {
    return this.headContributions;
  }
}

export default PageStructureElement;
