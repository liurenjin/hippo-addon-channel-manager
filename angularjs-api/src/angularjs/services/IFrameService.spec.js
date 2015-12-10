/*
 * Copyright 2015 Hippo B.V. (http://www.onehippo.com)
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

describe('IFrame Service', function () {
    'use strict';

    var iframeConfig, parentIFramePanel, $log, $window, iframeService, publishMock, subscribeMock;

    beforeEach(module('hippo.channel'));

    beforeEach(function() {
        iframeConfig = {
            testProperty: 'testValue'
        };

        publishMock = jasmine.createSpy('publish');
        subscribeMock = jasmine.createSpy('subscribe');
        parentIFramePanel = {
            initialConfig: {
                iframeConfig: iframeConfig
            },
            iframeToHost: {publish: publishMock},
            hostToIFrame: {subscribe: subscribeMock}
        };

        $window = {
            location: {
                search: '?parentExtIFramePanelId=ext-42&antiCache=1234'
            },
            self: $window,
            parent: {
                Ext: {
                    getCmp: function() {
                        return parentIFramePanel;
                    }
                }
            },
            document: jasmine.createSpyObj('document', ['getElementsByTagName', 'createElement'])
        };

        module(function($provide) {
            $provide.value('$window', $window);
        });
    });

    describe("runs in an iframe and", function () {

        beforeEach(inject([
            '$log', '_hippo.channel.IFrameService', function (log, IFrameService) {
                $log = log;
                iframeService = IFrameService;
            }
        ]));

        it('should be active', function () {
            expect(iframeService.isActive).toEqual(true);
        });

        it('should call the parent IFramePanel.iFrameToHost.publish', function () {
            iframeService.publish('browseTo', '/about');
            expect(publishMock).toHaveBeenCalledWith('browseTo', '/about');
        });

        it('should call the parent IFramePanel.hostToIFrame.subscribe', function () {
            iframeService.subscribe('test', 'callback', 'scope');
            expect(subscribeMock).toHaveBeenCalledWith('test', 'callback', 'scope');
        });

        it('should return the iframe config from the parent', function () {
            expect(iframeService.getConfig()).toEqual(iframeConfig);
        });

        it('should enable live reload in debug mode', function () {
            iframeConfig.debug = true;

            var head = jasmine.createSpyObj('head', ['appendChild']);
            $window.document.getElementsByTagName.and.returnValue([head]);

            spyOn($log, 'info');

            iframeService.enableLiveReload();

            expect(head.appendChild).toHaveBeenCalled();
            expect($log.info).toHaveBeenCalledWith('iframe #ext-42 has live reload enabled via //localhost:35729/livereload.js');
        });

        it('should not enable live reload in non-debug mode', function () {
            iframeConfig.debug = false;
            iframeService.enableLiveReload();
            expect($window.document.getElementsByTagName).not.toHaveBeenCalled();
        });

        it("should throw an error when the parent does not contain an IFramePanel with the given ID", function () {
            spyOn($window.parent.Ext, 'getCmp').and.returnValue(undefined);
            expect(iframeService.getConfig).toThrow(new Error("Unknown iframe panel id: 'ext-42'"));
        });

        it("should throw an error when the parent's IFramePanel does not contain any configuration for the iframe", function () {
            parentIFramePanel.initialConfig.iframeConfig = undefined;
            expect(iframeService.getConfig).toThrow(new Error("Parent iframe panel does not contain iframe configuration"));
        });
    });

    describe("does not run in an iframe and", function () {

        beforeEach(function () {
            $window.location.search = '';
            delete $window.parent;
        });

        beforeEach(inject([
            '$log', '_hippo.channel.IFrameService', function (log, IFrameService) {
                $log = log;
                iframeService = IFrameService;
            }
        ]));

        it('should not be active', function () {
            expect(iframeService.isActive).toEqual(false);
        });

        it("should return an empty configuration object when no parent IFramePanel ID is set", function () {
            expect(iframeService.getConfig()).toEqual({});
        });

        it("should ignore publish calls", function () {
            iframeService.publish('event', 'value');
            expect(publishMock.calls.count()).toEqual(0);
        });

        it("should ignore subscribe calls", function () {
            iframeService.subscribe('test', 'callback', 'scope');
            expect(subscribeMock.calls.count()).toEqual(0);
        });

    });

});
