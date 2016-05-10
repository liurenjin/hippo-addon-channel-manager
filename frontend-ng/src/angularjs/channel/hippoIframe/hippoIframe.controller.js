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

const CONTENT_LINK_MARKUP = '<a class="hst-cmseditlink"></a>';

export class HippoIframeCtrl {
  constructor(
    $q,
    $log,
    $element,
    $rootScope,
    $scope,
    $translate,
    ChannelService,
    CmsService,
    DialogService,
    DomService,
    DragDropService,
    hstCommentsProcessorService,
    linkProcessorService,
    OverlaySyncService,
    PageStructureService,
    PageMetaDataService,
    ScalingService,
    HippoIframeService
  ) {
    'ngInject';

    this.$q = $q;
    this.$log = $log;
    this.$rootScope = $rootScope;
    this.$translate = $translate;
    this.linkProcessorService = linkProcessorService;
    this.hstCommentsProcessorService = hstCommentsProcessorService;
    this.CmsService = CmsService;
    this.ChannelService = ChannelService;
    this.DialogService = DialogService;
    this.DomService = DomService;
    this.PageStructureService = PageStructureService;
    this.PageMetaDataService = PageMetaDataService;
    this.OverlaySyncService = OverlaySyncService;
    this.DragDropService = DragDropService;
    this.HippoIframeService = HippoIframeService;

    this.iframeJQueryElement = $element.find('iframe');
    this.iframeJQueryElement.on('load', () => this.onLoad());

    HippoIframeService.initialize(this.iframeJQueryElement);

    const baseJQueryElement = $element.find('.channel-iframe-base');
    OverlaySyncService.init(
      baseJQueryElement,
      $element.find('.channel-iframe-sheet'),
      $element.find('.channel-iframe-scroll-x'),
      this.iframeJQueryElement,
      $element.find('.overlay')
    );
    ScalingService.init($element);
    DragDropService.init(this.iframeJQueryElement, baseJQueryElement);

    const deleteComponentHandler = (componentId) => this.deleteComponent(componentId);
    CmsService.subscribe('delete-component', deleteComponentHandler);
    $scope.$on('$destroy', () => CmsService.unsubscribe('delete-component', deleteComponentHandler));

    $scope.$watch('iframe.editMode', () => this._updateDragDrop());
  }

  onLoad() {
    this._parseHstComments();
    this._showContentLinks().then(() => {
      this._updateDragDrop();
      this._updateChannelIfSwitched().then(() => {
        this._parseLinks();
        this.HippoIframeService.signalPageLoadCompleted();
      });
    });
    // TODO: handle error.
    // show dialog explaining that for this channel, the CM can currently not be used,
    // and return to the channel overview upon confirming?
  }

  deleteComponent(componentId) {
    const selectedComponent = this.PageStructureService.getComponentById(componentId);
    if (!selectedComponent) {
      this.$log.warn(`Cannot delete unknown component with id:'${componentId}'`);
      return;
    }
    this._confirmDelete(selectedComponent).then(
      this._doDelete(componentId),
      () => this.PageStructureService.showComponentProperties(selectedComponent)
    );
  }

  _doDelete(componentId) {
    return () => this.PageStructureService.removeComponentById(componentId)
      .then(
        ({ oldContainer, newContainer }) => this.DragDropService.replaceContainer(oldContainer, newContainer),
        // inform extjs to reset the component properties dialog if deletion is failed
        () => this.CmsService.publish('reset-component-properties')
      );
  }

  _confirmDelete(selectedComponent) {
    const confirm = this.DialogService.confirm()
      .title(this.$translate.instant('CONFIRM_DELETE_COMPONENT_TITLE'))
      .textContent(this.$translate.instant('CONFIRM_DELETE_COMPONENT_MESSAGE', {
        component: selectedComponent.getLabel(),
      }))
      .ok(this.$translate.instant('BUTTON_YES'))
      .cancel(this.$translate.instant('BUTTON_NO'));

    return this.DialogService.show(confirm);
  }

  _updateDragDrop() {
    if (this.editMode) {
      this.DragDropService.enable(this.PageStructureService.getContainers());
    } else {
      this.DragDropService.disable();
    }
  }

  startDragOrClick($event, component) {
    this.DragDropService.startDragOrClick($event, component);
  }

  isDraggingOrClicking() {
    return this.DragDropService.isDraggingOrClicking();
  }

  isDragging() {
    return this.DragDropService.isDragging();
  }

  _parseHstComments() {
    this.PageStructureService.clearParsedElements();
    this.hstCommentsProcessorService.run(
      this._getIframeDOM(),
      this.PageStructureService.registerParsedElement.bind(this.PageStructureService)
    );
  }

  _insertCss() {
    const iframeWindow = this._getIframeDOM().defaultView;
    const appRootUrl = this.DomService.getAppRootUrl();
    const hippoIframeCss = `${appRootUrl}styles/hippo-iframe.css`;
    return this.DomService.addCss(iframeWindow, hippoIframeCss);
  }

  _updateChannelIfSwitched() {
    const channelId = this.PageMetaDataService.getChannelId();
    if (channelId !== this.ChannelService.getId()) {
      return this.ChannelService.switchToChannel(channelId);
    }

    return this.$q.resolve();
  }

  _getIframeDOM() {
    return this.iframeJQueryElement.contents()[0];
  }

  _parseLinks() {
    const iframeDom = this._getIframeDOM();
    const protocolAndHost = `${iframeDom.location.protocol}//${iframeDom.location.host}`;
    const internalLinkPrefixes = this.ChannelService.getPreviewPaths().map((path) => protocolAndHost + path);

    this.linkProcessorService.run(iframeDom, internalLinkPrefixes);
  }

  _showContentLinks() {
    if (!this.PageStructureService.hasContentLinks()) {
      return this.$q.resolve();
    }

    return this._insertCss().then(() => {
      this.PageStructureService.getContentLinks().forEach((contentLink) => {
        const contentLinkElement = $(CONTENT_LINK_MARKUP);
        contentLink.getStartComment().after(contentLinkElement);
        contentLink.setBoxElement(contentLinkElement);
      });
    });
  }

  getContainers() {
    return this.editMode ? this.PageStructureService.getContainers() : [];
  }

  getContentLinks() {
    return !this.editMode ? this.PageStructureService.getContentLinks() : [];
  }

  openContent(contentLink) {
    this.CmsService.publish('open-content', contentLink.getUuid());
  }

  getSrc() {
    return this.HippoIframeService.getSrc();
  }
}
