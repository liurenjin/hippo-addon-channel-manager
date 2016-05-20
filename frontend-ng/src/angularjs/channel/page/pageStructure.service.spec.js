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

describe('PageStructureService', () => {
  'use strict';

  let PageStructureService;
  let PageMetaDataService;
  let ChannelService;
  let HstService;
  let RenderingService;
  let HippoIframeService;
  let FeedbackService;
  let $document;
  let $q;
  let $log;
  let $window;
  let $rootScope;

  beforeEach(() => {
    module('hippo-cm.channel.page');

    inject((_$q_, _$rootScope_, _$log_, _$document_, _$window_, _PageStructureService_, _PageMetaDataService_,
            _ChannelService_, _HstService_, _RenderingService_, _HippoIframeService_, _FeedbackService_) => {
      $q = _$q_;
      $rootScope = _$rootScope_;
      $log = _$log_;
      $document = _$document_;
      $window = _$window_;
      PageStructureService = _PageStructureService_;
      PageMetaDataService = _PageMetaDataService_;
      ChannelService = _ChannelService_;
      HstService = _HstService_;
      RenderingService = _RenderingService_;
      HippoIframeService = _HippoIframeService_;
      FeedbackService = _FeedbackService_;
    });

    spyOn(ChannelService, 'recordOwnChange');
  });

  beforeEach(() => {
    jasmine.getFixtures().load('channel/page/pageStructure.service.fixture.html');
  });

  it('has no containers initially', () => {
    expect(PageStructureService.getContainers()).toEqual([]);
    expect(PageStructureService.hasContainer()).toEqual(false);
  });

  it('has no content links initially', () => {
    expect(PageStructureService.getContentLinks()).toEqual([]);
    expect(PageStructureService.hasContentLinks()).toBe(false);
  });

  it('has no edit menu links initially', () => {
    expect(PageStructureService.getEditMenuLinks()).toEqual([]);
    expect(PageStructureService.hasEditMenuLinks()).toBe(false);
  });

  it('rejects components if there is no container yet', () => {
    spyOn($log, 'warn');
    PageStructureService.registerParsedElement(undefined, {
      'HST-Type': 'CONTAINER_ITEM_COMPONENT',
    });

    expect(PageStructureService.getContainers()).toEqual([]);
    expect($log.warn).toHaveBeenCalled();
  });

  const childComment = (element) => {
    const children = element.childNodes;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.nodeType === 8) {
        return child;
      }
    }
    return null;
  };

  const previousComment = (element) => {
    while (element.previousSibling) {
      element = element.previousSibling;
      if (element.nodeType === 8) {
        return element;
      }
    }
    return null;
  };

  const nextComment = (element) => {
    while (element.nextSibling) {
      element = element.nextSibling;
      if (element.nodeType === 8) {
        return element;
      }
    }
    return null;
  };

  const registerParsedElement = (commentElement) => {
    PageStructureService.registerParsedElement(commentElement, JSON.parse(commentElement.data));
  };

  const registerVBoxContainer = () => {
    const container = $j('#container-vbox', $document)[0];

    registerParsedElement(previousComment(container));

    return container;
  };

  const registerVBoxComponent = (id) => {
    const component = $j(`#${id}`, $document)[0];

    registerParsedElement(childComment(component));

    return component;
  };

  const registerNoMarkupContainer = () => {
    const container = $j('#container-no-markup', $document)[0];

    registerParsedElement(childComment(container));

    return container;
  };

  const registerNoMarkupComponent = () => {
    const component = $j('#component-no-markup', $document)[0];

    registerParsedElement(previousComment(component));

    return component;
  };

  const registerEmptyNoMarkupComponent = () => {
    registerParsedElement(nextComment(childComment($j('#container-no-markup', $document)[0])));
  };

  const registerEmbeddedLink = (selector) => {
    registerParsedElement(childComment($j(selector, $document)[0]));
  };

  it('registers containers in the correct order', () => {
    const container1 = registerVBoxContainer();
    const container2 = registerNoMarkupContainer();

    const containers = PageStructureService.getContainers();
    expect(containers.length).toEqual(2);

    expect(containers[0].type).toEqual('container');
    expect(containers[0].isEmpty()).toEqual(true);
    expect(containers[0].getComponents()).toEqual([]);
    expect(containers[0].getBoxElement()[0]).toEqual(container1);
    expect(containers[0].getLabel()).toEqual('vBox container');

    expect(containers[1].type).toEqual('container');
    expect(containers[1].isEmpty()).toEqual(true);
    expect(containers[1].getComponents()).toEqual([]);
    expect(containers[1].getBoxElement()[0]).toEqual(container2);
    expect(containers[1].getLabel()).toEqual('NoMarkup container');

    expect(PageStructureService.hasContainer(containers[0])).toEqual(true);
    expect(PageStructureService.hasContainer(containers[1])).toEqual(true);
  });

  it('adds components to the most recently registered container', () => {
    registerVBoxContainer();
    registerVBoxContainer();

    const componentA = registerVBoxComponent('componentA');
    const componentB = registerVBoxComponent('componentB');

    const containers = PageStructureService.getContainers();
    expect(containers.length).toEqual(2);
    expect(containers[0].isEmpty()).toEqual(true);
    expect(containers[1].isEmpty()).toEqual(false);
    expect(containers[1].getComponents().length).toEqual(2);

    expect(containers[1].getComponents()[0].type).toEqual('component');
    expect(containers[1].getComponents()[0].getBoxElement()[0]).toBe(componentA);
    expect(containers[1].getComponents()[0].getLabel()).toEqual('component A');
    expect(containers[1].getComponents()[0].container).toEqual(containers[1]);

    expect(containers[1].getComponents()[1].type).toEqual('component');
    expect(containers[1].getComponents()[1].getBoxElement()[0]).toBe(componentB);
    expect(containers[1].getComponents()[1].getLabel()).toEqual('component B');
    expect(containers[1].getComponents()[1].container).toEqual(containers[1]);
  });

  it('registers content links', () => {
    registerEmbeddedLink('#content-in-page');
    const contentLinks = PageStructureService.getContentLinks();
    expect(contentLinks.length).toBe(1);
    expect(contentLinks[0].getUuid()).toBe('content-in-page');
  });

  it('registers edit menu links', () => {
    registerEmbeddedLink('#edit-menu-in-page');
    expect(PageStructureService.getEditMenuLinks().length).toBe(1);
    expect(PageStructureService.getEditMenuLinks()[0].getUuid()).toBe('menu-in-page');
  });

  it('clears the page structure', () => {
    registerVBoxContainer();
    registerEmbeddedLink('#content-in-page');
    registerEmbeddedLink('#edit-menu-in-page');

    expect(PageStructureService.getContainers().length).toEqual(1);
    expect(PageStructureService.getContentLinks().length).toEqual(1);
    expect(PageStructureService.getEditMenuLinks().length).toBe(1);

    PageStructureService.clearParsedElements();

    expect(PageStructureService.getContainers().length).toEqual(0);
    expect(PageStructureService.getContentLinks().length).toEqual(0);
    expect(PageStructureService.getEditMenuLinks().length).toBe(0);
  });

  it('registers additional elements', () => {
    registerVBoxContainer();

    const testElement = $j('#test', $document);

    const containers = PageStructureService.getContainers();
    containers[0].setJQueryElement('test', testElement);

    expect(containers[0].getJQueryElement('test')).toEqual(testElement);
  });

  it('finds the DOM element of a transparent container as parent of the comment', () => {
    const container = registerNoMarkupContainer();

    const containers = PageStructureService.getContainers();
    expect(containers.length).toEqual(1);
    expect(containers[0].getBoxElement()[0]).toBe(container);
  });

  it('finds the DOM element of a component of a transparent container as next sibling of the comment', () => {
    registerNoMarkupContainer();

    const component = registerNoMarkupComponent();

    const containers = PageStructureService.getContainers();
    expect(containers.length).toEqual(1);
    expect(containers[0].isEmpty()).toEqual(false);
    expect(containers[0].getComponents().length).toEqual(1);
    expect(containers[0].getComponents()[0].getBoxElement()[0]).toBe(component);
    expect(containers[0].getComponents()[0].hasNoIFrameDomElement()).not.toEqual(true);
  });

  it('registers no iframe box element in case of a transparent, empty component', () => {
    registerNoMarkupContainer();
    registerEmptyNoMarkupComponent();

    const containers = PageStructureService.getContainers();
    expect(containers.length).toEqual(1);
    expect(containers[0].isEmpty()).toEqual(false);
    expect(containers[0].getComponents().length).toEqual(1);
    expect(containers[0].getComponents()[0].getBoxElement().length).toEqual(0);
  });

  it('parses the page meta-data and adds it to the PageMetaDataService', () => {
    spyOn(PageMetaDataService, 'add');

    PageStructureService.registerParsedElement(null, {
      'HST-Type': 'PAGE-META-DATA',
      'HST-Mount-Id': 'testMountId',
    });

    expect(PageMetaDataService.add).toHaveBeenCalledWith({
      'HST-Mount-Id': 'testMountId',
    });
  });

  it('switches channels when the channel id in the page meta-data is the same as the current channel id', () => {
    spyOn(ChannelService, 'getId').and.returnValue('testChannelId');
    spyOn(ChannelService, 'switchToChannel');

    PageStructureService.registerParsedElement(null, {
      'HST-Type': 'PAGE-META-DATA',
      'HST-Channel-Id': 'testChannelId',
    });

    expect(ChannelService.switchToChannel).not.toHaveBeenCalled();
  });

  it('ignores unknown HST types', () => {
    PageStructureService.registerParsedElement(null, {
      'HST-Type': 'unknown type',
    });
  });

  it('returns a known component', () => {
    registerVBoxContainer();
    registerVBoxContainer();
    registerVBoxComponent('componentA');

    const pageComponent = PageStructureService.getComponentById('aaaa');

    expect(pageComponent).not.toBeNull();
    expect(pageComponent.getId()).toEqual('aaaa');
    expect(pageComponent.getLabel()).toEqual('component A');
  });

  it('returns null when getting an unknown component', () => {
    expect(PageStructureService.getComponentById('no-such-component')).toBeNull();
  });

  it('removes a valid component and calls HST successfully', () => {
    registerVBoxContainer();
    registerVBoxComponent('componentA');

    spyOn(HstService, 'removeHstComponent').and.returnValue($q.when([]));
    spyOn(RenderingService, 'fetchContainerMarkup').and.returnValue($q.when(''));

    PageStructureService.removeComponentById('aaaa');

    $rootScope.$digest();

    expect(HstService.removeHstComponent).toHaveBeenCalledWith('container-vbox', 'aaaa');
    expect(ChannelService.recordOwnChange).toHaveBeenCalled();
  });

  it('removes a valid component but fails to call HST due to an unknown reason, then iframe should be reloaded and a feedback toast should be shown', () => {
    registerVBoxContainer();
    registerVBoxComponent('componentA');

    spyOn(FeedbackService, 'showError');
    spyOn(HippoIframeService, 'reload').and.returnValue($q.when(''));
    // mock the call to HST to be failed
    spyOn(HstService, 'removeHstComponent').and.returnValue($q.reject({ error: 'unknown', parameterMap: {} }));

    PageStructureService.removeComponentById('aaaa');
    $rootScope.$digest();

    expect(HstService.removeHstComponent).toHaveBeenCalledWith('container-vbox', 'aaaa');

    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_DELETE_COMPONENT',
      jasmine.objectContaining({ component: 'component A' }));

    expect(HippoIframeService.reload).toHaveBeenCalled();
  });

  it('removes a valid component but fails to call HST due to locked component then iframe should be reloaded and a feedback toast should be shown', () => {
    registerVBoxContainer();
    registerVBoxComponent('componentA');

    spyOn(FeedbackService, 'showError');
    spyOn(HippoIframeService, 'reload').and.returnValue($q.when(''));
    // mock the call to HST to be failed
    spyOn(HstService, 'removeHstComponent').and.returnValue($q.reject({ error: 'ITEM_ALREADY_LOCKED', parameterMap: {} }));

    PageStructureService.removeComponentById('aaaa');
    $rootScope.$digest();

    expect(HstService.removeHstComponent).toHaveBeenCalledWith('container-vbox', 'aaaa');

    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_DELETE_COMPONENT_ITEM_ALREADY_LOCKED',
      jasmine.objectContaining({ component: 'component A' }));

    expect(HippoIframeService.reload).toHaveBeenCalled();
  });

  it('removes an invalid component', () => {
    registerVBoxContainer();
    registerVBoxComponent('componentA');

    spyOn(HstService, 'removeHstComponent').and.returnValue($q.when([]));

    PageStructureService.removeComponentById('unknown-component');
    $rootScope.$digest();

    expect(HstService.removeHstComponent).not.toHaveBeenCalled();
  });

  it('returns a container by iframe element', () => {
    registerVBoxContainer();
    const containerElement = registerNoMarkupContainer();

    const container = PageStructureService.getContainerByIframeElement(containerElement);

    expect(container).not.toBeNull();
    expect(container.getId()).toEqual('container-no-markup');
  });

  it('triggers an event to show the component properties dialog', () => {
    const componentElement = jasmine.createSpyObj(['getId', 'getLabel', 'getLastModified']);
    componentElement.getId.and.returnValue('testId');
    componentElement.getLabel.and.returnValue('testLabel');
    componentElement.getLastModified.and.returnValue(12345);
    componentElement.container = jasmine.createSpyObj(['isDisabled', 'isInherited']);
    componentElement.container.isDisabled.and.returnValue(true);
    componentElement.container.isInherited.and.returnValue(false);

    spyOn(PageMetaDataService, 'get').and.returnValue({
      testMetaData: 'foo',
    });

    spyOn($window.APP_TO_CMS, 'publish');

    PageStructureService.showComponentProperties(componentElement);

    expect($window.APP_TO_CMS.publish).toHaveBeenCalledWith('show-component-properties', {
      component: {
        id: 'testId',
        label: 'testLabel',
        lastModified: 12345,
      },
      container: {
        isDisabled: true,
        isInherited: false,
      },
      page: {
        testMetaData: 'foo',
      },
    });
  });

  it('ignores erroneous calls to showComponentProperties', () => {
    spyOn($log, 'warn');
    spyOn($window.APP_TO_CMS, 'publish');

    PageStructureService.showComponentProperties(undefined);

    expect($log.warn).toHaveBeenCalled();
    expect($window.APP_TO_CMS.publish).not.toHaveBeenCalled();
  });

  it('shows the default error message when failed to add a new component from catalog', () => {
    const catalogComponent = {
      id: 'foo-bah',
      name: 'Foo Bah Component',
    };
    const mockContainer = jasmine.createSpyObj(['getId']);
    mockContainer.getId.and.returnValue('container-1');

    spyOn(FeedbackService, 'showError');
    spyOn(HippoIframeService, 'reload').and.returnValue($q.when());
    const deferred = $q.defer();
    spyOn(HstService, 'addHstComponent').and.returnValue(deferred.promise);

    PageStructureService.addComponentToContainer(catalogComponent, mockContainer);
    deferred.reject({
      error: 'cafebabe-error-key',
      parameterMap: {},
    });
    $rootScope.$digest();

    expect(HstService.addHstComponent).toHaveBeenCalledWith(catalogComponent, 'container-1');
    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_ADD_COMPONENT', { component: 'Foo Bah Component' });
    expect(HippoIframeService.reload).toHaveBeenCalled();
  });

  it('shows the locked error message when adding a new component and the container was locked by another user', () => {
    const catalogComponent = {
      id: 'foo-bah',
      name: 'Foo Bah Component',
    };
    const mockContainer = jasmine.createSpyObj(['getId']);
    mockContainer.getId.and.returnValue('container-1');

    spyOn(HippoIframeService, 'reload').and.returnValue($q.when());
    spyOn(FeedbackService, 'showError');
    const deferred = $q.defer();
    spyOn(HstService, 'addHstComponent').and.returnValue(deferred.promise);

    PageStructureService.addComponentToContainer(catalogComponent, mockContainer);
    deferred.reject({
      error: 'ITEM_ALREADY_LOCKED',
      parameterMap: {
        lockedBy: 'another-user',
        lockedOn: 1234,
      },
    });
    $rootScope.$digest();

    expect(HstService.addHstComponent).toHaveBeenCalledWith(catalogComponent, 'container-1');
    expect(FeedbackService.showError).toHaveBeenCalledWith('ERROR_ADD_COMPONENT_ITEM_ALREADY_LOCKED', {
      lockedBy: 'another-user',
      lockedOn: 1234,
      component: 'Foo Bah Component',
    });
    expect(HippoIframeService.reload).toHaveBeenCalled();
  });

  it('prints parsed elements', () => {
    registerVBoxContainer();
    registerVBoxComponent('componentA');
    registerVBoxComponent('componentB');

    spyOn($log, 'debug');

    PageStructureService.printParsedElements();

    expect($log.debug.calls.count()).toEqual(3);
  });

  it('attaches the embedded link to the enclosing component', () => {
    registerVBoxContainer();
    registerVBoxComponent('componentA');
    registerVBoxComponent('componentB');
    registerEmbeddedLink('#edit-menu-in-component-a');
    registerEmbeddedLink('#edit-menu-in-page');
    registerEmbeddedLink('#content-in-page');
    registerEmbeddedLink('#content-in-container-vbox');

    const containerVBox = PageStructureService.getContainers()[0];
    const componentA = containerVBox.getComponents()[0];

    expect(PageStructureService.getEditMenuLinks().length).toBe(2);
    expect(PageStructureService.getEditMenuLinks()[0].getEnclosingElement()).toBeUndefined();
    expect(PageStructureService.getEditMenuLinks()[1].getEnclosingElement()).toBeUndefined();
    expect(PageStructureService.getContentLinks().length).toBe(2);
    expect(PageStructureService.getContentLinks()[0].getEnclosingElement()).toBeUndefined();
    expect(PageStructureService.getContentLinks()[1].getEnclosingElement()).toBeUndefined();

    expect(PageStructureService.getEditMenuLinks()[0].getBoxElement().length).toBe(0);

    PageStructureService.attachEmbeddedLinks();

    expect(PageStructureService.getEditMenuLinks().length).toBe(2);
    expect(PageStructureService.getEditMenuLinks()[0].getEnclosingElement()).toBe(componentA);
    expect(PageStructureService.getEditMenuLinks()[1].getEnclosingElement()).toBe(null);
    expect(PageStructureService.getContentLinks().length).toBe(2);
    expect(PageStructureService.getContentLinks()[0].getEnclosingElement()).toBe(null);
    expect(PageStructureService.getContentLinks()[1].getEnclosingElement()).toBe(containerVBox);

    expect(PageStructureService.getEditMenuLinks()[0].getBoxElement().length).toBe(1);
    expect(PageStructureService.getEditMenuLinks()[0].getBoxElement().attr('class')).toBe('hst-cmseditlink');
  });

  it('re-renders a component with an edit menu link', () => {
    // set up page structure with component and edit menu link in it
    registerVBoxContainer();
    registerVBoxComponent('componentA');
    registerEmbeddedLink('#edit-menu-in-component-a');
    registerEmbeddedLink('#edit-menu-in-page');
    PageStructureService.attachEmbeddedLinks();

    const updatedMarkup = `
      <!-- { "HST-Type": "CONTAINER_ITEM_COMPONENT", "HST-Label": "component A", "uuid": "aaaa" } -->
        <p id="updated-edit-menu-in-component-a">
          <!-- { "HST-Type": "EDIT_MENU_LINK", "uuid": "updated-menu-in-component-a" } -->
        </p>
      <!-- { "HST-End": "true", "uuid": "aaaa" } -->
      `;
    spyOn(RenderingService, 'fetchComponentMarkup').and.returnValue($q.when({ data: updatedMarkup }));
    const propertiesMap = { };
    PageStructureService.renderComponent('aaaa', propertiesMap);
    $rootScope.$digest();

    const updatedComponentA = PageStructureService.getContainers()[0].getComponents()[0];
    expect(PageStructureService.getEditMenuLinks().length).toBe(2);
    expect(PageStructureService.getEditMenuLinks()[0].getEnclosingElement()).toBe(null);
    expect(PageStructureService.getEditMenuLinks()[1].getEnclosingElement()).toBe(updatedComponentA);
  });

  it('re-renders a component with no more content link', () => {
    // set up page structure with component and content link in it
    registerNoMarkupContainer();
    registerNoMarkupComponent();
    registerEmbeddedLink('#content-in-component-no-markup');
    PageStructureService.attachEmbeddedLinks();

    const updatedMarkup = `
      <!-- { "HST-Type": "CONTAINER_ITEM_COMPONENT", "HST-Label": "Component in NoMarkup container", "uuid": "component-no-markup" } -->
        <div id="component-no-markup">
          <p>Some markup in component D</p>
        </div>
      <!-- { "HST-End": "true", "uuid": "component-no-markup" } -->
      `;
    spyOn(RenderingService, 'fetchComponentMarkup').and.returnValue($q.when({ data: updatedMarkup }));
    const propertiesMap = { };
    PageStructureService.renderComponent('component-no-markup', propertiesMap);
    $rootScope.$digest();

    expect(PageStructureService.getContentLinks().length).toBe(0);
  });

  it('re-renders a component, adding an edit menu link', () => {
    // set up page structure with component and edit menu link in it
    registerVBoxContainer();
    registerVBoxComponent('componentA');
    PageStructureService.attachEmbeddedLinks();

    expect(PageStructureService.getEditMenuLinks().length).toBe(0);

    const updatedMarkup = `
      <!-- { "HST-Type": "CONTAINER_ITEM_COMPONENT", "HST-Label": "component A", "uuid": "aaaa" } -->
        <p id="updated-edit-menu-in-component-a">
          <!-- { "HST-Type": "EDIT_MENU_LINK", "uuid": "updated-menu-in-component-a" } -->
        </p>
      <!-- { "HST-End": "true", "uuid": "aaaa" } -->
      `;
    spyOn(RenderingService, 'fetchComponentMarkup').and.returnValue($q.when({ data: updatedMarkup }));
    const propertiesMap = { };
    PageStructureService.renderComponent('aaaa', propertiesMap);
    $rootScope.$digest();

    const updatedComponentA = PageStructureService.getContainers()[0].getComponents()[0];
    expect(PageStructureService.getEditMenuLinks().length).toBe(1);
    expect(PageStructureService.getEditMenuLinks()[0].getEnclosingElement()).toBe(updatedComponentA);
  });

  it('gracefully handles requests to re-render an unknown component', () => {
    spyOn($log, 'warn');
    spyOn(RenderingService, 'fetchComponentMarkup');

    PageStructureService.renderComponent('unknown-component', { });

    expect($log.warn).toHaveBeenCalled();
    expect(RenderingService.fetchComponentMarkup).not.toHaveBeenCalled();
  });

  it('does not add a re-rendered and incorrectly commented component to the page structure', () => {
    registerVBoxContainer();
    registerVBoxComponent('componentA');

    const updatedMarkup = `
      <!-- { "HST-Type": "CONTAINER_ITEM_COMPONENT", "HST-Label": "component A", "uuid": "aaaa" } -->
        <p id="updated-edit-menu-in-component-a">
          <!-- { "HST-Type": "EDIT_MENU_LINK", "uuid": "updated-menu-in-component-a" } -->
        </p>
      `;
    spyOn($log, 'error');
    spyOn(RenderingService, 'fetchComponentMarkup').and.returnValue($q.when({ data: updatedMarkup }));
    PageStructureService.renderComponent('aaaa', { });
    $rootScope.$digest();

    expect(PageStructureService.getContainers().length).toBe(1);
    expect(PageStructureService.getContainers()[0].getComponents().length).toBe(0);
    expect($log.error).toHaveBeenCalled();
  });

  it('retrieves a container by overlay element', () => {
    registerVBoxContainer();
    const container = PageStructureService.getContainers()[0];
    const overlayElement = { };

    expect(PageStructureService.getContainerByOverlayElement({ })).toBeUndefined();
    container.setOverlayElement(overlayElement);

    expect(PageStructureService.getContainerByOverlayElement({ })).toBeUndefined();
    expect(PageStructureService.getContainerByOverlayElement(overlayElement)).toBeUndefined();
  });

  it('re-renders a container with an edit menu link', (done) => {
    // set up page structure with component and edit menu link in it
    registerVBoxContainer();
    registerVBoxComponent('componentA');
    registerEmbeddedLink('#edit-menu-in-component-a');
    registerEmbeddedLink('#edit-menu-in-page');
    registerEmbeddedLink('#content-in-page');
    registerEmbeddedLink('#content-in-container-vbox');
    PageStructureService.attachEmbeddedLinks();

    const container = PageStructureService.getContainers()[0];
    const updatedMarkup = `
      <!-- { "HST-Type": "CONTAINER_COMPONENT", "HST-Label": "vBox container", "HST-XType": "HST.vBox", "uuid": "container-vbox" } -->
      <div id="container-vbox">
        <div id="componentA">
          <!-- { "HST-Type": "CONTAINER_ITEM_COMPONENT", "HST-Label": "component A", "uuid": "aaaa" } -->
          <p id="test">Some markup in component A</p>
          <!-- { "HST-End": "true", "uuid": "aaaa" } -->
        </div>
        <p id="new-content-in-container-vbox">
          <!-- { "HST-Type": "CONTENT_LINK", "uuid": "new-content-in-container-vbox" } -->
        </p>
      </div>
      <!-- { "HST-End": "true", "uuid": "container-vbox" } -->
      `;
    spyOn(RenderingService, 'fetchContainerMarkup').and.returnValue($q.when(updatedMarkup));
    PageStructureService.renderContainer(container).then((newContainer) => {
      expect(PageStructureService.getContainers().length).toBe(1);
      expect(PageStructureService.getContainers()[0]).toBe(newContainer);

      // edit menu link in component A is no longer there
      expect(PageStructureService.getEditMenuLinks().length).toBe(1);
      expect(PageStructureService.getEditMenuLinks()[0].getUuid()).toBe('menu-in-page');

      expect(PageStructureService.getContentLinks().length).toBe(2);
      expect(PageStructureService.getContentLinks()[0].getUuid()).toBe('content-in-page');
      expect(PageStructureService.getContentLinks()[1].getUuid()).toBe('new-content-in-container-vbox');
      expect(PageStructureService.getContentLinks()[1].getEnclosingElement()).toBe(newContainer);

      done();
    });
    $rootScope.$digest();
  });
});
