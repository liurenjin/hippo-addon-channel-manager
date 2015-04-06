/*
 * Copyright 2014-2015 Hippo B.V. (http://www.onehippo.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

describe('Menu Service', function () {
  'use strict';

  var menuService, $httpBackend;

  beforeEach(module('hippo.channel.menu'));

  beforeEach(function () {
    module(function ($provide) {
      $provide.value('hippo.channel.ConfigService', {
        apiUrlPrefix: 'api',
        menuId: 'menuId'
      });
      $provide.value('hippo.channel.HstApiRequests', jasmine.createSpy());
    });
  });

  beforeEach(inject(function ($injector) {
    $httpBackend = $injector.get('$httpBackend');
    $httpBackend.when('GET', 'api/menuId').respond({
      data: {
        items: [
          {
            id: '1',
            link: 'http://onehippo.org',
            linkType: 'EXTERNAL',
            title: 'One'
          },
          {
            id: '2',
            link: 'home',
            linkType: 'SITEMAPITEM',
            title: 'Two',
            items: [
              {
                id: 'child1',
                title: 'Child 1'
              }
            ]
          },
          {
            id: '3',
            title: 'One'
          }
        ]
      }
    });
  }));

  beforeEach(inject([
    'hippo.channel.menu.MenuService',
    function (MenuService) {
      menuService = MenuService;
    }
  ]));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('should exist', function () {
    expect(menuService).toBeDefined();
  });

  function expectGetMenu () {
    $httpBackend.expectGET('api/menuId');
    $httpBackend.flush();
  }

  it('should get menu by id ', function () {
    menuService.getMenu().then(function (menu) {
      expect(menu).toBeDefined();
      expect(menu.items.length).toEqual(3);
    });
    expectGetMenu();
  });

  function testGetMenuItem (id) {
    menuService.getMenuItem(id).then(function (menuItem) {
      expect(menuItem).toBeDefined();
      expect(menuItem.id).toEqual(id);
    });
    expectGetMenu();
  }

  it('should return a main menu item by id', function () {
    testGetMenuItem('2');
  });

  it('should return a child menu item by id', function () {
    testGetMenuItem('child1');
  });

  it('should return undefined when getting an unknown menu item', function () {
    menuService.getMenuItem('nosuchitem').then(function (menuItem) {
      expect(menuItem).toBeUndefined();
    });
    expectGetMenu();
  });

  it('should update the returned menu data when the title of a menu item changes', function () {
    menuService.getMenu().then(function (menu) {
      menuService.getMenuItem('child1').then(function (child1) {
        child1.title = 'New title';
        expect(menu.items[1].items[0].title).toEqual('New title');
      });
    });
    expectGetMenu();
  });

  it('should return externalLink split from the normal link', function () {
    menuService.getMenuItem('1').then(function (menuItem) {
      expect(menuItem).toBeDefined();
      expect(menuItem.externalLink).toBeDefined();
      expect(menuItem.externalLink).toEqual('http://onehippo.org');
    });
    expectGetMenu();
  });

  it('should return sitemapLink split from the normal link', function () {
    menuService.getMenuItem('2').then(function (menuItem) {
      expect(menuItem).toBeDefined();
      expect(menuItem.sitemapLink).toBeDefined();
      expect(menuItem.sitemapLink).toEqual('home');
    });
    expectGetMenu();
  });

  it('should save a menu item', function () {
    var menuItemToSave = {
        id: 'child1',
        items: [
          {
            id: 'child2',
            title: 'Child 2',
            sitemapLink: 'home',
            linkType: 'SITEMAPITEM'
          }
        ],
        externalLink: 'http://onehippo.org',
        linkType: 'EXTERNAL',
        title: 'New title'
      },
      savedMenuItem = {
        id: 'child1',
        items: [
          {
            id: 'child2',
            title: 'Child 2',
            link: 'home',
            linkType: 'SITEMAPITEM'
          }
        ],
        link: 'http://onehippo.org',
        linkType: 'EXTERNAL',
        title: 'New title'
      };
    $httpBackend.expectPOST('api/menuId', savedMenuItem).respond('OK');
    menuService.saveMenuItem(menuItemToSave);
    $httpBackend.flush();
  });

  it('should delete a menu item by id', function () {
    // make sure the menu has been loaded
    menuService.getMenu().then(function (menu) {
    });
    expectGetMenu();

    menuService.deleteMenuItem('3');

    $httpBackend.expectPOST('api/menuId./delete/3').respond('OK');
    $httpBackend.flush();
  });

  it('should not delete a menu item by id on server error', function () {

    $httpBackend.expectPOST('api/menuId./delete/1').respond(500, 'NOT OK');

    var spy = {
      errorFn: function (reason) {
      }
    };
    spyOn(spy, 'errorFn');

    menuService.getMenu().then(function () {
      var promise = menuService.deleteMenuItem('1');
      promise.then(undefined, function () {
        spy.errorFn();
      });
    });
    $httpBackend.flush();

    expect(spy.errorFn).toHaveBeenCalled();
  });

  it('should create a menu item', function () {
    var newMenuItem = {id: 'child1', title: 'New title'};
    $httpBackend.expectPOST('api/menuId./create/parentId', newMenuItem).respond('OK');
    menuService.createMenuItem('parentId', newMenuItem);
    $httpBackend.flush();
  });

  it('should process all pending changes', inject(function ($rootScope) {
    var savedMenuItem = {id: 'child1', title: 'New title'};
    $httpBackend.expectPOST('api/menuId', savedMenuItem).respond('OK');
    menuService.saveMenuItem(savedMenuItem);

    var promise = menuService.processAllChanges(),
      allChangesProcessed = false;

    promise.then(function () {
      allChangesProcessed = true;
    });

    expect(allChangesProcessed).toEqual(false);

    $httpBackend.flush();

    // let Angular resolve all promises
    $rootScope.$apply();

    expect(allChangesProcessed).toEqual(true);
  }));

  it('should process no changes by returning directly', inject(function ($rootScope) {
    var promise = menuService.processAllChanges(),
      allChangesProcessed = false;

    promise.then(function () {
      allChangesProcessed = true;
    });

    expect(allChangesProcessed).toEqual(false);

    // let Angular resolve all promises
    $rootScope.$apply();

    expect(allChangesProcessed).toEqual(true);
  }));

  it('should delete collapsed property before sending to server', inject(function () {
    var menuItem = {id: 'id', collapsed: true};

    $httpBackend.expectPOST('api/menuId', {id: 'id'}).respond('OK');

    menuService.saveMenuItem(menuItem);

    $httpBackend.flush();
  }));
});
