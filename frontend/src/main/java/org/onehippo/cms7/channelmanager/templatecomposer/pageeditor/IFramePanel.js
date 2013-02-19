/*
 * Copyright 2013 Hippo B.V. (http://www.onehippo.com)
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
(function () {
    "use strict";

    Ext.ns('Hippo.ChannelManager.TemplateComposer');

    Hippo.ChannelManager.TemplateComposer.IFramePanel = Ext.extend(Ext.Panel, (function () {
        // private variables
        var frameId, lastLocation, instance, resizeTask;

        frameId = Ext.id();

        // private methods
        function getFrame() {
            return document.getElementById(frameId);
        }

        function getFrameDom() {
            return Ext.getDom(frameId);
        }

        function getFrameDocument() {
            return getFrame().contentDocument;
        }

        function getFrameWindow() {
            return getFrame().contentWindow;
        }

        function getFrameLocation() {
            var frameDocument, href;

            frameDocument = getFrameDocument();

            if (frameDocument !== undefined && frameDocument.location !== undefined) {
                href = frameDocument.location.href;
                if (href !== undefined && href !== '' && href !== 'about:blank') {
                    return href;
                }
            }
            return getFrameDom().src;
        }

        function detachFrame() {
            lastLocation = undefined;
            instance.hostToIFrame.unsubscribeAll();
        }

        function onFrameLoad() {
            var frameLocation = getFrameLocation();

            if (frameLocation !== lastLocation) {
                detachFrame();
                lastLocation = frameLocation;
                instance.fireEvent('locationchanged');
            }
        }

        function doResize() {
            instance.hostToIFrame.publish('resize');
        }

        function onResize() {
            // throttle the number of 'resize' events send to the iframe
            if (resizeTask === undefined) {
                resizeTask = new Ext.util.DelayedTask(doResize);
            }
            resizeTask.delay(25);
        }

        // public methods
        return {

            hostToIFrame: null,
            iframeToHost: null,

            constructor: function (config) {
                // global singleton
                Hippo.ChannelManager.TemplateComposer.IFramePanel.Instance = instance = this;

                this.hostToIFrame = Hippo.ChannelManager.TemplateComposer.createMessageBus('host-to-iframe');
                this.iframeToHost = Hippo.ChannelManager.TemplateComposer.createMessageBus('iframe-to-host');

                this.addEvents(
                    'locationchanged'
                );

                Hippo.ChannelManager.TemplateComposer.IFramePanel.superclass.constructor.call(this, Ext.apply(config, {
                    border: false,
                    layout: 'fit',
                    items: {
                        xtype: 'box',
                        id: frameId,
                        autoEl: {
                            tag: 'iframe',
                            frameborder: 0
                        }
                    }
                }));
            },

            afterRender: function() {
                Hippo.ChannelManager.TemplateComposer.IFramePanel.superclass.afterRender.apply(this, arguments);

                var frameElement = Ext.getCmp(frameId).el;
                frameElement.addListener('load', onFrameLoad, this);

                this.on('resize', onResize, this);
            },

            setLocation: function(url) {
                detachFrame();
                getFrameDom().src = url;
            },

            getLocation: function() {
                return getFrameLocation();
            },

            getElement: function(id) {
                return getFrameDocument().getElementById(id);
            },

            reload: function() {
                detachFrame();
                getFrameDocument().location.reload(true);
            },

            createHeadFragment: function() {
                // create an object to add elements to the iframe head using a DOM document fragment when possible

                var frameDocument, documentFragment, api;

                frameDocument = getFrameDocument();

                function getHead() {
                    var headElements, head;

                    headElements = frameDocument.getElementsByTagName('head');

                    if (Ext.isEmpty(headElements)) {
                        head = frameDocument.createElement('head');
                        frameDocument.getElementsByTagName('html')[0].appendChild(head);
                    } else {
                        head = headElements[0];
                    }
                    return head;
                }

                function addElement(tagName, text, attributes) {
                    var element, textNode;

                    element = frameDocument.createElement(tagName);

                    if (Ext.isIE8) {
                        element.text = text;
                    } else {
                        textNode = frameDocument.createTextNode(text);
                        element.appendChild(textNode);
                    }

                    Ext.iterate(attributes, function (attribute, value) {
                        element[attribute] = value;
                    });

                    if (documentFragment === undefined) {
                        documentFragment = getFrameDocument().createDocumentFragment();
                    }
                    documentFragment.appendChild(element);
                }

                api = {

                    addScript: function(text, title) {
                        addElement('script', text, {
                            type: 'text/javascript',
                            title: title || 'inline'
                        });
                        return api;
                    },

                    addStyleSheet: function(text, title) {
                        if (Ext.isIE8) {
                            frameDocument.createStyleSheet().cssText = text;
                        } else {
                            addElement('style', text, {
                                type: 'text/css',
                                title: title
                            });
                        }
                        return api;
                    },

                    flush: function() {
                        if (documentFragment !== undefined) {
                            getHead().appendChild(documentFragment);
                            documentFragment = undefined;
                        }
                    }

                };

                return api;
            },

            mask: function() {
                this.el.mask();
            },

            unmask: function() {
                this.el.unmask();
            },

            getScrollPosition: function() {
                var frameWindow = getFrameWindow();
                return {
                    x: frameWindow.pageXOffset,
                    y: frameWindow.pageYOffset
                };
            },

            scrollBy: function(x, y) {
                getFrameWindow().scrollBy(x, y);
            },

            isValidSession: function(sessionCookie) {
                var result = false;

                Ext.each(getFrameDocument().cookie.split(';'), function(keyValue) {
                    var equalsIndex, key, value;

                    equalsIndex = keyValue.indexOf('=');
                    key = keyValue.substr(0, equalsIndex).trim();
                    value = keyValue.substr(equalsIndex + 1).trim();

                    if (key === 'JSESSIONID' && value === sessionCookie) {
                        result = true;
                        return false;
                    }
                }, this);

                return result;
            }

        };
    }()));
    Ext.reg('Hippo.ChannelManager.TemplateComposer.IFramePanel', Hippo.ChannelManager.TemplateComposer.IFramePanel);

}());
