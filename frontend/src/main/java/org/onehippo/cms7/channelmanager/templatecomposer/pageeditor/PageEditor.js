/*
 *  Copyright 2010 Hippo.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
"use strict";
Ext.namespace('Hippo.ChannelManager.TemplateComposer');

Hippo.ChannelManager.TemplateComposer.PageEditor = Ext.extend(Ext.Panel, {

    constructor : function(config) {
        if (config.debug) {
            Ext.Ajax.timeout = 90000; // this changes the 30 second default to 90 seconds
        }

        this.ids = {
            pageUrl : null,
            pageId : null,
            mountId : null
        };

        this.stores = {
            toolkit : null,
            pageModel : null
        };

        if (config.composerMountUrl.lastIndexOf('/') !== config.composerMountUrl.length - 1) {
            config.composerMountUrl = config.composerMountUrl + '/';
        }
        if (config.renderHostSubMountPath && config.renderHostSubMountPath.indexOf('/') === 0) {
            config.renderHostSubMountPath = config.renderHostSubMountPath.substr(1);
        }

        this.isPreviewHstConfig = false;
        this.composerInitialized = false;
        this.pageModelStoreLoaded = false;

        this.addEvents('beforePreCacheIFrameResources', 'afterPreCacheIFrameResources',
                       'beforePageIdChange', 'beforeMountIdChange',
                       'beforeIFrameDOMReady', 'afterIFrameDOMReady',
                       'beforePageModelStoreLoad', 'pageModelStoreLoad',
                       'beforeRequestHstMetaData', 'beforeHstMetaDataResponse', 'afterHstMetaDataResponse',
                       'beforeInitializeIFrameHead', 'afterInitializeIFrameHead', 'iFrameInitialized',
                       'isPreviewHstConfig',
                       'iFrameException');

        this.pageModelFacade = null;

        this.iframeResourceCache = [];
        this.preCacheIFrameResources(config);

        this.initUI(config);

        Hippo.ChannelManager.TemplateComposer.PageEditor.superclass.constructor.call(this, config);
    },

    //Keeps the session alive every minute
    keepAlive : function() {
        Ext.Ajax.request({
            url: this.composerRestMountUrl + 'cafebabe-cafe-babe-cafe-babecafebabe./keepalive?'+this.ignoreRenderHostParameterName+'=true',
            success: function () {
                // Do nothing
            }
        });
    },

    initUI : function(config) {
        Ext.apply(config, { items :
            [
                {
                    id: 'Iframe',
                    xtype: 'iframepanel',
                    // loadMask: true,
                    collapsible: false,
                    disableMessaging: false,
                    tbar: [
                        {
                            text : config.resources['back-to-channel-manager-button'],
                            id : "channelManager",
                            listeners : {
                                'click' : {
                                    fn : function() {
                                        Ext.getCmp('rootPanel').showChannelManager();
                                    },
                                    scope: this
                                }
                            }
                        },
                        {
                            text: config.resources['preview-button'],
                            iconCls: 'title-button',
                            id: 'pagePreviewButton',
                            toggleGroup : 'composerMode',
                            pressed: config.previewMode,
                            allowDepress: false,
                            width: 150,
                            disabled: true
                        },
                        {
                            text: config.resources['edit-button'],
                            iconCls: 'title-button',
                            id: 'pageComposerButton',
                            enableToggle: true,
                            toggleGroup : 'composerMode',
                            pressed: !config.previewMode,
                            allowDepress: false,
                            width: 150,
                            disabled: true,
                            listeners: {
                                'toggle': {
                                    fn : this.toggleMode,
                                    scope: this
                                }
                            }
                        },
                        {
                            text: config.resources['publish-button'],
                            iconCls: 'title-button',
                            id: 'publishHstConfig',
                            width: 150,
                            disabled: true,
                            listeners: {
                                'click': {
                                    fn : function() {
                                        this.publishHstConfiguration();
                                    },
                                    scope: this
                                }
                            }
                        },
                        {
                            id: 'channelName',
                            xtype: 'tbtext',
                            text: '',
                            style: {
                                marginLeft: '150px'
                            }
                        }
                    ]
                }
            ]
        });

        if (config.debug) {
            Ext.data.DataProxy.addListener('exception', function(proxy, type, action, options, res, e) {
                if (!res.success && res.message) {
                    console.error(res.message);
                }
                else {
                    if (e) {
                        if(typeof console.error == 'function') {
                           console.error(e);
                        } else {
                            throw e;
                        }
                    } else if(res.status) {
                        var json = Ext.util.JSON.decode(res.responseText);
                        var msg = '<br/><b>StatusText:</b> ' + res.statusText + '<br/><b>StatusCode:</b> ' + res.status +
                                '<br/><b>Detailed message:</b> ' + json.message;
                        console.error(json.message);
                    } else {
                        console.group("Exception");
                        console.dir(arguments);
                        console.groupEnd();
                    }
                }
            }, this);

            Ext.data.DataProxy.addListener('write', function(proxy, action, result, res, rs) {
                console.log('Data Proxy Action: ' + action + '<br/>Message: ' + res.message);
            }, this);
        }
    },

    initComponent : function() {
        Hippo.ChannelManager.TemplateComposer.PageEditor.superclass.initComponent.call(this);
        // recalculate the ExtJs layout when the YUI layout manager fires a resize event
        this.on('afterrender', function() {
            var yuiLayout = this.getEl().findParent("div.yui-layout-unit");
            YAHOO.hippo.LayoutManager.registerResizeListener(yuiLayout, this, function() {
                Ext.getCmp('Iframe').setSize(arguments[0].body.w, arguments[0].body.h);
            }, true);

            if (this.renderHostSubMountPath && this.renderHost) {
                this.initComposer(this.renderHostSubMountPath, this.renderHost);
            }
        }, this, {single: true});

        this.on('beforePreCacheIFrameResources', function() {
            console.log('beforePreCacheIFrameResources');
            this.iframeResourcesCached = false;
        }, this);

        this.on('afterPreCacheIFrameResources', function() {
            console.log('afterPreCacheIFrameResources');
            this.iframeResourcesCached = true;
        }, this);

        this.on('beforeIFrameDOMReady', function() {
            console.log('beforeIFrameDOMReady');
            this.iframeDOMReady = false;
            this.iframeInitialized = false;
            this.overlayBuild = false;
            var hideLoading = function() {
                Hippo.Msg.hide();
                Ext.getCmp('pagePreviewButton').setDisabled(false);
                Ext.getCmp('pageComposerButton').setDisabled(false);
            };
            if (this.previewMode) {
                this.on('beforeIFrameDOMReady', function() {
                    this.removeListener('beforeIFrameDOMReady', hideLoading, this);
                }, this, {single: true});
                this.on('iFrameInitialized', hideLoading, this, {single : true});
            } else {
                this.on('beforeIFrameDOMReady', function() {
                    this.removeListener('afterBuildOverlay', hideLoading, this);
                }, this, {single: true});
                this.on('afterBuildOverlay', hideLoading, this, {single : true});
            }
            Ext.getCmp('pagePreviewButton').setDisabled(true);
            Ext.getCmp('pageComposerButton').setDisabled(true);
            Hippo.Msg.wait(this.resources['loading-message']);
        }, this);

        this.on('afterIFrameDOMReady', function() {
            console.log('afterIFrameDOMReady');
            this.iframeDOMReady = true;
        }, this);

        this.on('beforeInitializeIFrameHead', function() {
            this.initializingIFrameHead = true;
            console.log('beforeInitializeIFrameHead');
        }, this);

        this.on('iFrameInitialized', function() {
            console.log('onIFrameInitialized');
            this.initializingIFrameHead = false;
            this.iframeInitialized = true;
        }, this);

        this.on('beforeChangeModeTo', function(data) {
            console.log('beforeChangeModeTo' + JSON.stringify(data));
        }, this);

        this.on('afterBuildOverlay', function(data) {
            this.overlayBuild = true;
        }, this);

        this.on('beforeChangeModeTo', function(data) {
            this.creatingPreviewHstConfig = !data.previewMode && !data.isPreviewHstConfig;
        }, this);

        this.on('beforeInitComposer', function() {
            Hippo.Msg.wait(this.resources['loading-message']);
            this.previewMode = true;
            this.ids.pageId = null;
            this.ids.mountId = null;
            this.ids.pageUrl = null;
            this.pageModelStoreLoaded = false;
            this.isPreviewHstConfig = false;
            this.channelName = null;
            this.resetIFrameState();
            Ext.getCmp('pagePreviewButton').toggle(true, true);
            Ext.getCmp('pageComposerButton').toggle(false, true);
            Ext.getCmp('pagePreviewButton').setDisabled(true);
            Ext.getCmp('pageComposerButton').setDisabled(true);
            Ext.getCmp('publishHstConfig').setDisabled(true);
            if (this.mainWindow) {
                this.mainWindow.hide();
            }
        }, this);

        this.on('afterInitComposer', function() {
            Ext.getCmp('pagePreviewButton').setDisabled(false);
            Ext.getCmp('pageComposerButton').setDisabled(false);
            Hippo.Msg.hide();
            this.composerInitialized = true;
        }, this);

        this.on('toggleMode', function(data) {
            console.log('toggleMode '+JSON.stringify(data));
            this.creatingPreviewHstConfig = false;
            Ext.getCmp('pagePreviewButton').setDisabled(data.previewMode);
            Ext.getCmp('pageComposerButton').setDisabled(!data.previewMode);
            Hippo.Msg.wait(this.resources['loading-message']);
        }, this);

        this.on('modeChanged', function(data) {
            console.log('mode changed');
            this.creatingPreviewHstConfig = false;
            if (data.previewMode) {
                if (this.mainWindow) {
                    this.mainWindow.hide();
                }
            } else {
                if (this.mainWindow) {
                    this.mainWindow.show();
                }
            }
            Ext.getCmp('pagePreviewButton').setDisabled(false);
            Ext.getCmp('pageComposerButton').setDisabled(false);
            Hippo.Msg.hide();
        }, this);

        this.on('isPreviewHstConfigChanged', function(data) {
            console.log('isPreviewHstConfigChanged ' + data.isPreviewHstConfig);
            Ext.getCmp('publishHstConfig').setDisabled(!data.isPreviewHstConfig);
        }, this);

        this.on('beforePublishHstConfiguration', function() {
            Ext.getCmp('publishHstConfig').setDisabled(true);
            Ext.getCmp('pagePreviewButton').setDisabled(true);
            Ext.getCmp('pageComposerButton').setDisabled(true);
        }, this);

        this.on('afterPublishHstConfiguration', function() {
            Ext.getCmp('pagePreviewButton').setDisabled(false);
            Ext.getCmp('pageComposerButton').setDisabled(false);
        }, this);

        this.on('fatalIFrameException', function(data) {
            var iFrame = Ext.getCmp('Iframe');
            var frm = iFrame.getFrame();
            if (frm !== null && data.msg) {
                this.on('afterIFrameDOMReady', function () {
                    frm.execScript('setErrorMessage(\''+data.msg+'\');', true);
                }, this, {single : true});
                frm.isReset = false;
                frm.setSrc(this.iFrameErrorPage);
            }
        }, this);

        this.on('beforePageModelStoreLoad', function(data) {
            console.log('beforePageModelStoreLoad');
            this.pageModelStoreLoaded = false;
        }, this);

        this.on('pageModelStoreLoad', function(data) {
            console.log('pageModelStoreLoad');
            this.pageModelStoreLoaded = true;
        }, this);

        this.on('beforeMountIdChange', function(data) {
            if (!this.preview && !data.isPreviewHstConfig && this.isPreviewHstConfig != data.isPreviewHstConfig) {
                // switching mount when edit is active and no preview available on the new mount
                Ext.getCmp('pagePreviewButton').toggle(true);
            }
        }, this);
    },

    initToolkitStore : function(mountId) {
        this.stores.toolkit = this.createToolkitStore(mountId);
        this.stores.toolkit.on('exception', function(dataProxy, type, action, options, response, arg) {
            if (type === 'response') {
                console.error('Server returned status '+response.status+" for the toolkit store.");
            } else if (type === 'remote') {
                console.error('Error handling the response of the server for the toolkit store. Response is:\n'+response.responseText);
            }
            Hippo.Msg.alert(this.resources['toolkit-store-error-message-title'], this.resources['toolkit-store-error-message'], function(id) {
                this.initComposer(this.renderHostSubMountPath, this.renderHost);
            }, this);
        }, this);
        this.stores.toolkit.load();
        if (this.mainWindow) {
            var grid = Ext.getCmp('ToolkitGrid');
            grid.reconfigure(this.stores.toolkit, grid.getColumnModel());
        } else {
            this.mainWindow = this.createMainWindow(mountId);
        }
        this.mainWindow.show();
    },

    initPageModelStore : function(mountId, pageId) {
        this.stores.pageModel = this.createPageModelStore(mountId, pageId);
        this.stores.pageModel.on('exception', function(dataProxy, type, action, options, response, arg) {
            if (type === 'response') {
                console.error('Server returned status '+response.status+" for the page store.");
            } else if (type === 'remote') {
                console.error('Error handling the response of the server for the page store. Response is:\n'+response.responseText);
            }
            Hippo.Msg.alert(this.resources['page-store-error-message-title'], this.resources['page-store-error-message'], function(id) {
                this.initComposer(this.renderHostSubMountPath, this.renderHost);
            }, this);
        }, this);
        this.stores.pageModel.load();

        if (this.mainWindow) {
            console.log('reconfigure page model grid');
            var grid = Ext.getCmp('PageModelGrid');
            grid.reconfigure(this.stores.pageModel, grid.getColumnModel());
            this.mainWindow.show();
        }
    },

    preCacheIFrameResources : function(config) {
        this.fireEvent('beforePreCacheIFrameResources');
        var self = this;
        // clone array with concat()
        var queue = config.iFrameCssHeadContributions.concat().concat(config.iFrameJsHeadContributions);
        var requestContents = function(queueEmptyCallback) {
            if (queue.length == 0) {
                queueEmptyCallback();
                return;
            }
            var src = queue.shift();
            Ext.Ajax.request({
                url : src,
                method : 'GET',
                success : function(result, request) {
                    self.iframeResourceCache[src] = result.responseText;
                    requestContents(queueEmptyCallback);
                },
                failure : function(result, request) {
                    self.fireEvent.apply(self, ['fatalIFrameException', {msg : self.resources['pre-cache-iframe-resources-exception'].format(src)}]);
                }
            });
        };
        requestContents(
            function() {
                self.iframeResourcesCached = true;
                self.fireEvent.call(self, 'afterPreCacheIFrameResources');
            }
        );
    },

    initComposer : function(renderHostSubMountPath, renderHost) {
        this.fireEvent('beforeInitComposer');
        this.on('iFrameInitialized', function() {
            this.fireEvent('afterInitComposer');
        }, this, {single : true});
        if (renderHostSubMountPath && renderHostSubMountPath.indexOf('/') === 0) {
            this.renderHostSubMountPath = renderHostSubMountPath.substr(1);
        } else {
            this.renderHostSubMountPath = renderHostSubMountPath;
        }
        this.renderHost = renderHost;

        this.initIFrameListeners();

        var retry = this.initialHstConnectionTimeout;
        var me = this;
        // do initial handshake with CmsSecurityValve of the composer mount and
        // go ahead with the actual host which we want to edit (for which we need to be authenticated)
        var composerMode = function(callback) {
            Ext.Ajax.request({
                url: me.composerRestMountUrl + 'cafebabe-cafe-babe-cafe-babecafebabe./composermode/'+me.renderHost+'/?'+me.ignoreRenderHostParameterName+'=true',
                success: callback,
                failure: function(exceptionObject) {
                    if (exceptionObject.isTimeout) {
                        retry = retry - Ext.Ajax.timeout;
                    }
                    if (retry > 0) {
                        retry = retry - Ext.Ajax.timeout;
                        window.setTimeout(function() {
                            composerMode(callback);
                        }, Ext.Ajax.timeout);
                    } else {
                        Hippo.Msg.hide();
                        Hippo.Msg.confirm(me.resources['hst-timeout-message-title'], me.resources['hst-timeout-message'], function(id) {
                            if (id === 'yes') {
                                retry = me.initialHstConnectionTimeout;
                                Hippo.Msg.wait(me.resources['loading-message']);
                                composerMode(callback);
                            } else {
                                me.fireEvent.apply(me, ['fatalIFrameException', {msg : me.resources['hst-timeout-iframe-exception']}]);
                            }
                        });
                    }
                }
            });
        };
        composerMode(function() {
            var iFrame = Ext.getCmp('Iframe');
            iFrame.frameEl.isReset = false; // enable domready get's fired workaround, we haven't set defaultSrc on the first place
            iFrame.setSrc(me.composerMountUrl + me.renderHostSubMountPath);

            // keep session active
            Ext.TaskMgr.start({
                run: me.keepAlive,
                interval: 60000,
                scope: me
            });
        });
    },

    initIFrameListeners : function() {
        var iFrame = Ext.getCmp('Iframe');
        iFrame.purgeListeners();
        iFrame.on('message', this.handleFrameMessages, this);
        iFrame.on('documentloaded', function(frm) {
            if (Ext.isSafari || Ext.isChrome) {
                this.onIframeDOMReady(frm);
            }
        }, this);
        iFrame.on('domready', function(frm) {
            // Safari && Chrome report a DOM ready event, but js is not yet fully loaded, resulting
            // in 'undefined' errors.
            if (Ext.isGecko || Ext.isIE) {
                this.onIframeDOMReady(frm);
            }
        }, this);
        iFrame.on('exception', function(frm, e) {
            console.error(e);
        }, this);
        iFrame.on('resize', function() {
            this.sendFrameMessage({}, 'resize');
        }, this);
    },

    setChannelName : function(name) {
        if (typeof this.showTitleSwitchTimeout !== 'undefined') {
            window.clearTimeout(this.showTitleSwitchTimeout);
        }
        var oldName = this.channelName;
        this.channelName = name;
        var channelNameText = Ext.getCmp('channelName');
        if (typeof oldName !== 'undefined' && oldName !== null) {
            channelNameText.setText(this.resources['channel-switch-text'].format(oldName, name));
            this.showTitleSwitchTimeout = window.setTimeout(function() {
                channelNameText.setText(name);
            }, 5000);
        } else {
            channelNameText.setText(name);
        }
    },

    publishHstConfiguration : function() {
        this.fireEvent('beforePublishHstConfiguration');
        var self = this;
        Ext.Ajax.request({
            method: 'POST',
            url: this.composerRestMountUrl + this.ids.mountId + './publish?'+this.ignoreRenderHostParameterName+'=true',
            success: function () {
                Ext.getCmp('pagePreviewButton').toggle(true);
                self.on.apply(self, ['afterIFrameDOMReady', function() {
                    this.fireEvent('afterPublishHstConfiguration');
                }, self, {single : true}]);
                self.refreshIframe.call(self, null);
            },
            failure: function(result) {
                var jsonData = Ext.util.JSON.decode(result.responseText);
                Hippo.Msg.alert(self.resources['published-hst-config-failed-message-title'], self.resources['published-hst-config-failed-message']+' '+jsonData.message, function() {
                    this.initComposer(this.renderHostSubMountPath, this.renderHost);
                });
            }
        });
    },

    toggleMode: function () {
        this.fireEvent('toggleMode', {previewMode : this.previewMode});

        var func = function() {
            this.previewMode = !this.previewMode;
            var toggleModeClosure = function(mountId, pageId, isPreviewHstConfig) {
                console.log('isPreviewHstConfig:' + isPreviewHstConfig);
                this.fireEvent('beforeChangeModeTo', {previewMode : this.previewMode, isPreviewHstConfig : isPreviewHstConfig});
                if (this.previewMode) {
                    var iFrame = Ext.getCmp('Iframe');
                    if (!this.iframeInitialized) {
                        this.on('iFrameInitialized', function() {
                            iFrame.getFrame().sendMessage({}, 'hideoverlay');
                        }, this, {single: true});
                    } else {
                        iFrame.getFrame().sendMessage({}, 'hideoverlay');
                    }
                    this.fireEvent('modeChanged', {previewMode : this.previewMode});
                } else {
                    if (isPreviewHstConfig) {
                        var iFrame = Ext.getCmp('Iframe');
                        if (!this.iframeInitialized) {
                            this.on('iFrameInitialized', function() {
                                iFrame.getFrame().sendMessage({}, ('showoverlay'));
                            }, this, {single: true});
                        } else {
                            iFrame.getFrame().sendMessage({}, ('showoverlay'));
                        }

                        if (this.overlayBuild) {
                            this.fireEvent('modeChanged', {previewMode : this.previewMode});
                        } else {
                            this.on('afterBuildOverlay', function() {
                                this.fireEvent('modeChanged', {previewMode : this.previewMode});
                            }, this, { single: true});
                        }
                    } else {
                        // create new preview hst configuration
                        var self = this;
                        Ext.Ajax.request({
                            method: 'POST',
                            url: this.composerRestMountUrl + mountId + './edit?'+this.ignoreRenderHostParameterName+'=true',
                            success: function () {
                                // refresh iframe to get new hst config uuids. previewMode=false will initialize
                                // the editor for editing with the refresh
                                self.on('afterBuildOverlay', function() {
                                    self.fireEvent.apply(self, ['modeChanged', {previewMode : self.previewMode}]);
                                }, self, { single: true});
                                self.refreshIframe.call(self, null);
                            },
                            failure: function(result) {
                                var jsonData = Ext.util.JSON.decode(result.responseText);
                                Hippo.Msg.alert(self.resources['preview-hst-config-creation-failed-title'], self.resources['preview-hst-config-creation-failed'] + ' ' + jsonData.message, function() {
                                    self.initComposer.apply(self, [self.renderHostSubMountPath, self.renderHost]);
                                });
                            }
                        });
                    }
                }
            };
            if (this.isHstMetaDataLoaded()) {
                toggleModeClosure.apply(this, [this.ids.mountId, this.ids.pageId, this.isPreviewHstConfig]);
            } else {
                this.on('afterHstMetaDataResponse', function(data) {
                    toggleModeClosure.apply(this, [data.mountId, data.pageId, data.isPreviewHstConfig]);
                }, this, {single : true});
            }
        }

        if (this.iframeDOMReady) {
            func.call(this);
        } else {
            this.on('afterIFrameDOMReady', func, this, {single : true});
        }

        return true;
    },

    refreshIframe : function() {
        console.log('refreshIframe');
        this.resetIFrameState();
        var iframe = Ext.getCmp('Iframe');
        var frame = iframe.getFrame();
        var window = frame.getWindow();
        var scrollSave = {x: window.pageXOffset, y: window.pageYOffset};
        this.on('beforeIFrameDOMReady', function() {
            window.scrollBy(scrollSave.x, scrollSave.y);
        }, this, {single : true});
        iframe.setSrc(iframe.getFrameDocument().location.href); //following links in the iframe doesn't set iframe.src..
    },

    resetIFrameState : function() {
        this.iframeDOMReady = false;
        this.iframeInitialized = false;
    },

    onIframeDOMReady : function(frm) {
        this.fireEvent('beforeIFrameDOMReady');
        this.frm = frm;

        // TODO implement pattern similar to promises to remove the boilerplate code

        // snapshot of previewMode for the closures
        var previewMode = this.previewMode;

        this.on('beforeMountIdChange', function(data) {
            console.log('beforeMountIdChange, previewMode: '+previewMode);
            if (!previewMode) {
                this.initToolkitStore(data.mountId);
            } else {
                var initToolkitStoreClosure = function() {
                    this.initToolkitStore(data.mountId);
                };
                this.on('beforeMountIdChange', function() {
                    this.removeListener('beforeChangeModeTo', initToolkitStoreClosure, this);
                }, this, {single: true});
                this.on('beforeChangeModeTo', initToolkitStoreClosure, this, {single : true});
            }
        }, this, {single: true});

        this.on('beforePageIdChange', function(data) {
            console.log('beforePageIdChange, previewMode: '+previewMode);
            this.pageModelStoreLoaded = false;
            if (!previewMode) {
                this.initPageModelStore(data.mountId, data.pageId);
            } else {
               var initPageModelStoreClosure = function(changeModeData) {
                   if (!changeModeData.previewMode && !changeModeData.isPreviewHstConfig) {
                       // if iframe gets refreshed due to creation of hst preview config,
                       // prevent loading. Store gets loaded afterwards with refresh of iframe which
                       // triggers beforePageIdChange again because the page uuid changed
                       return;
                   }
                   this.initPageModelStore(data.mountId, data.pageId);
               };
               this.on('beforePageIdChange', function() {
                   this.removeListener('beforeChangeModeTo', initPageModelStoreClosure, this);
               }, this, {single: true});
               this.on('beforeChangeModeTo', initPageModelStoreClosure, this, {single : true});
            }
        }, this, {single: true});

        this.requestHstMetaData( { url: frm.getDocumentURI() } );

        var buildOverlayIfIFrameInitializedAndPageModelStoreLoaded = function() {
            var buildOverlayIfPageModelStoreLoaded = function() {
                console.log('buildOverlayIfPageModelStoreLoaded');
                if (this.pageModelStoreLoaded) {
                    console.log('pageModelStoreLoaded true, buildOverlay');
                    this.buildOverlay.call(this);
                } else {
                    console.log('pageModelStoreLoaded false, schedule buildOverlay with pageModelStoreLoad');
                    this.on('beforeIFrameDOMReady', function() {
                        this.removeListener('pageModelStoreLoad', this.buildOverlay, this);
                    }, this, {single: true});
                    this.on('pageModelStoreLoad', this.buildOverlay, this, {single: true});
                }
            };

            this.on('beforeIFrameDOMReady', function() {
                this.removeListener('afterHstMetaDataResponse', buildOverlayIfPageModelStoreLoaded, this);
            }, this, {single: true});
            this.on('afterHstMetaDataResponse', buildOverlayIfPageModelStoreLoaded, this, {single: true});
        };

        this.on('beforeIFrameDOMReady', function() {
            this.removeListener('iFrameInitialized', buildOverlayIfIFrameInitializedAndPageModelStoreLoaded, this);
        }, this, {single : true});
        this.on('iFrameInitialized', buildOverlayIfIFrameInitializedAndPageModelStoreLoaded, this, {single : true});

        this.initializeIFrameHead(frm, previewMode);

        this.fireEvent('afterIFrameDOMReady');
    },

    initializeIFrameHead : function(frm, previewMode) {
        this.fireEvent('beforeInitializeIFrameHead');

        var func = function() {
            for (var i = 0, len = this.iFrameCssHeadContributions.length; i < len; i++) {
                var src = this.iFrameCssHeadContributions[i];
                var responseText = this.iframeResourceCache[src];
                var frmDocument = frm.getFrameDocument();

                if (Ext.isIE) {
                    var style = frmDocument.createStyleSheet().cssText = responseText;
                } else {
                    var headElements = frmDocument.getElementsByTagName("HEAD");
                    var head;
                    if (headElements.length == 0) {
                        head = frmDocument.createElement("HEAD");
                        frmDocument.appendChild(head);
                    } else {
                        head = headElements[0];
                    }

                    var styleElement = frmDocument.createElement("STYLE");
                    styleElement.setAttribute("type", "text/css");
                    var textNode = frmDocument.createTextNode(responseText);
                    styleElement.appendChild(textNode);
                    styleElement.setAttribute("title", src);
                    head.appendChild(styleElement);
                }
            }

            for (var i = 0, len = this.iFrameJsHeadContributions.length; i < len; i++) {
                var src = this.iFrameJsHeadContributions[i];
                var responseText = this.iframeResourceCache[src];
                (function(src, responseText) {
                    window.setTimeout(function() {
                        frm.writeScript.apply(frm, [responseText, {type: "text/javascript", "title" : src}]);
                    }, 0);
                })(src, responseText);
            }

            // remove global jquery references and restore previous 'jQuery' and '$' objects on window scope
            window.setTimeout(function() {
                frm.execScript(' jQuery.noConflict(true); ', true);
            }, 0);

            var self = this;
            window.setTimeout(function() {
                frm.sendMessage({debug: self.debug,
                                 previewMode: previewMode,
                                 resources: self.resources}, 'init');
                self.fireEvent.call(self, 'afterInitializeIFrameHead');
            }, 0);
        };

        if (this.iframeResourcesCached) {
            func.call(this);
        } else {
            this.on('afterPreCacheIFrameResources', func, this, {single : true});
        }
    },

    requestHstMetaData: function(options) {
        this.fireEvent('beforeRequestHstMetaData');
        console.log('requestHstMetaData' + JSON.stringify(options));
        var self = this;
        Ext.Ajax.request({
            method: "HEAD",
            url : options.url,
            success : function(responseObject) {
                if (options.url !== self.frm.getDocumentURI()) {
                    // response is out of date
                    return;
                }
                var data = {
                    url : options.url,
                    oldUrl : self.ids.pageUrl,
                    pageId : responseObject.getResponseHeader('HST-Page-Id'),
                    oldPageId : self.ids.pageId,
                    mountId : responseObject.getResponseHeader('HST-Mount-Id'),
                    oldMountId : self.ids.oldMountId,
                    siteId : responseObject.getResponseHeader('HST-Site-Id'),
                    oldSiteId : self.ids.oldSiteId,
                    isPreviewHstConfig : self.getBoolean(responseObject.getResponseHeader('HST-Site-HasPreviewConfig'))
                };

                self.fireEvent.apply(self, ['beforeHstMetaDataResponse', data]);
                console.log('hstMetaDataResponse '+JSON.stringify(data));

                if (data.mountId != self.ids.mountId) {
                    if (self.fireEvent.apply(self, ['beforeMountIdChange', data])) {
                        self.ids.mountId = data.mountId;
                    }
                }

                if (data.pageId != self.ids.pageId) {
                    if (self.fireEvent.apply(self, ['beforePageIdChange', data])) {
                        self.ids.pageId = data.pageId;
                    }
                }

                if (data.url !== self.ids.pageUrl) {
                    if (self.fireEvent.apply(self, ['beforePageUrlChange', data])) {
                        console.log('set pageUrl to '+data.url);
                        self.ids.pageUrl = data.url;
                    }
                }

                if (self.isPreviewHstConfig !== data.isPreviewHstConfig) {
                    self.isPreviewHstConfig = data.isPreviewHstConfig;
                    self.fireEvent.apply(self, ['isPreviewHstConfigChanged', data]);
                }

                self.fireEvent.apply(self, ['afterHstMetaDataResponse', data]);
            },
            failure : function(responseObject) {
                self.fireEvent.apply(self, ['fatalIFrameException', { msg: self.resources['hst-meta-data-request-failed']}]);
            }
        });
    },

    getBoolean: function(object) {
        if (typeof object === 'undefined' || object === null) {
            return null;
        }
        if (object === true || object === false) {
            return object;
        }
        var str = object.toString().toLowerCase();
        if (str === "true") {
            return true;
        } else if (str === "false") {
            return false
        }
        return null;
    },

    isHstMetaDataLoaded : function() {
        console.log('isHstMetaDataLoaded '+this.ids.pageUrl+', '+this.frm.getDocumentURI());
        return this.ids.pageUrl === this.frm.getDocumentURI();
    },

    createToolkitStore : function(mountId) {
        return new Hippo.ChannelManager.TemplateComposer.ToolkitStore({
            mountId : mountId,
            composerRestMountUrl : this.composerRestMountUrl,
            ignoreRenderHostParameterName: this.ignoreRenderHostParameterName
        });
    },

    createPageModelStore : function(mountId, pageId) {
        return new Hippo.ChannelManager.TemplateComposer.PageModelStore({
            rootComponentIdentifier: this.rootComponentIdentifier,
            mountId: mountId,
            pageId: pageId,
            composerRestMountUrl: this.composerRestMountUrl,
            ignoreRenderHostParameterName: this.ignoreRenderHostParameterName,
            resources: this.resources,
            listeners: {
                write : {
                    fn: function(store, action, result, res, records) {
                        if (action == 'create') {
                            records = Ext.isArray(records) ? records : [records];
                            for (var i = 0; i < records.length; i++) {
                                var record = records[i];
                                if (record.get('type') == HST.CONTAINERITEM) {
                                    //add id to parent children map
                                    var parentId = record.get('parentId');
                                    var parentIndex = store.findExact('id', parentId);
                                    var parentRecord = store.getAt(parentIndex);
                                    var children = parentRecord.get('children');
                                    children.push(record.get('id'));
                                    parentRecord.set('children', children);
                                }
                            }
                        } else if (action == 'update') {
                        if (!this.isReloading) {
                            store.reload();
                            this.isReloading = true;
                        }
                        }
                    },
                    scope: this
                },
                beforeload: {
                    fn : function(store, options) {
                        this.fireEvent('beforePageModelStoreLoad');
                    },
                    scope: this
                },
                load :{
                    fn : function(store, records, options) {
                        this.isReloading = false;
                        this.fireEvent('pageModelStoreLoad');
                    },
                    scope: this
                },
                remove : {
                    fn : function(store, record, index) {

                        if (record.get('type') == HST.CONTAINER) {
                            //remove all children as well
                            Ext.each(record.get('children'), function(id) {
                                var childIndex = store.findExact('id', id);
                                if (childIndex > -1) {
                                    store.removeAt(childIndex);
                                }
                            });
                        } else {
                            //containerItem: unregister from parent
                            var parentRecord = store.getAt(store.findExact('id', record.get('parentId')));
                            if (typeof parentRecord !== 'undefined') {
                                var children = parentRecord.get('children');
                                children.remove(record.get('id'));
                                parentRecord.set('children', children);
                            }
                        }
                        var grid = Ext.getCmp('PageModelGrid');
                        if (grid.getSelectionModel().getSelected() == record) {
                            this.deselect(null, null, record);
                        }
                    },
                    scope : this
                }
            }
        });
    },

    createMainWindow : function(mountId) {
        var window1 = new Hippo.ux.window.FloatingWindow({
            title: this.resources['main-window-title'],
            x:10, y: 35,
            width: 310,
            height: 650,
            initRegion: 'right',
            layout: 'border',
            closable: true,
            constrainHeader: true,
            closeAction: 'hide',
            bodyStyle: 'background-color: #ffffff',
            renderTo: Ext.getCmp('Iframe').getEl(),
            constrain: true,
            items: [
                {
                    region: 'north',
                    split:true,
                    layout: 'accordion',
                    height: 300,
                    items:[
                        {
                            xtype: 'h_base_grid',
                            flex:2,
                            id: 'ToolkitGrid',
                            title: this.resources['toolkit-grid-title'],
                            store: this.stores.toolkit,
                            cm: new Ext.grid.ColumnModel({
                                columns: [
                                    { header: this.resources['toolkit-grid-column-header-name'], dataIndex: 'name', id:'name', viewConfig :{width: 40}}
//                                    { header: "Id", dataIndex: 'id', id:'id', viewConfig :{width: 40}},
//                                    { header: "Path", dataIndex: 'path', id:'path', viewConfig :{width: 120}}
                                ],
                                defaults: {
                                    sortable: true,
                                    menuDisabled: true
                                }
                            }),
                            plugins: [
                                Hippo.ChannelManager.TemplateComposer.DragDropOne
                            ]
                        },
                        {
                            xtype: 'h_base_grid',
                            flex: 3,
                            id: 'PageModelGrid',
                            title: this.resources['page-model-grid-title'],
                            store: this.stores.pageModel,
                            sm: new Ext.grid.RowSelectionModel({
                                singleSelect: true,
                                listeners: {
                                    rowselect: {
                                        fn: this.select,
                                        scope: this
                                    },
                                    rowdeselect: {
                                        fn: this.deselect,
                                        scope: this
                                    }
                                }
                            }),
                            cm : new Ext.grid.ColumnModel({
                                columns: [
                                    { header: this.resources['page-model-grid-column-header-name'], dataIndex: 'name', id:'name', viewConfig :{width: 120}},
                                    { header: this.resources['page-model-grid-column-header-type'], dataIndex: 'type', id:'type'},
                                    { header: this.resources['page-model-grid-column-header-template'], dataIndex: 'template', id:'template'}
                                ],
                                defaults: {
                                    sortable: false,
                                    menuDisabled: true
                                }
                            }),
                            menuProvider: this
                        }
                    ]
                },
                {
                    id: 'componentPropertiesPanel',
                    xtype:'h_properties_panel',
                    region: 'center',
                    split: true,
                    resources: this.resources,
                    locale: this.locale,
                    composerRestMountUrl: this.composerRestMountUrl,
                    ignoreRenderHostParameterName: this.ignoreRenderHostParameterName,
                    mountId: mountId
                }
            ]
        });
        return window1;
    },

    buildOverlay : function() {
        if (!this.fireEvent('beforeBuildOverlay')) {
            return;
        }
        console.log('buildOverlay');
        var self = this;
        this.sendFrameMessage({
            getName : function(id) {
                var idx = self.stores.pageModel.findExact('id', id);
                if (idx == -1) {
                    return null;
                }
                var record = self.stores.pageModel.getAt(idx);
                return record.get('name');
            }
        }, 'buildoverlay');
        this.fireEvent('afterBuildOverlay');
    },

    handleOnClick : function(element) {
        if (element.getAttribute(HST.ATTR.INHERITED)) {
            return;
        }
        var id = element.getAttribute('id');
        var recordIndex = this.stores.pageModel.findExact('id', id);

        if (recordIndex < 0) {
            console.warn('Handling onClick for element[id=' + id + '] with no record in component store');
            return;
        }

        var sm = Ext.getCmp('PageModelGrid').getSelectionModel();
        if (sm.isSelected(recordIndex)) {
            sm.deselectRow(recordIndex);
        } else {
            sm.selectRow(recordIndex);
        }
    },

    findElement: function(id) {
        var frameDoc = Ext.getCmp('Iframe').getFrameDocument();
        var el = frameDoc.getElementById(id);
        return el;
    },

    select : function(model, index, record) {
        this.sendFrameMessage({element: record.data.element}, 'select');
        if (record.get('type') === HST.CONTAINERITEM) {
            this.showProperties(record);
        }
    },

    deselect : function(model, index, record) {
        this.sendFrameMessage({element: record.data.element}, 'deselect');
        this.hideProperties();
    },

    onRearrangeContainer: function(id, children) {
        var self = this;
        window.setTimeout(function() {
            try {
                var recordIndex = self.stores.pageModel.findExact('id', id); //should probably do this through the selectionModel
                var record = self.stores.pageModel.getAt(recordIndex);
                record.set('children', children);
                console.log('onRearrangeContainer '+id+', children: '+children);
                record.commit();
            } catch (exception) {
                console.error('onRearrangeContainer '+exception);
            }
        }, 0);
    },

    handleReceivedItem : function(containerId, element) {
        //we reload for now so no action here, children value update of containers will take care of it
    },

    sendFrameMessage : function(data, name) {
        Ext.getCmp('Iframe').getFrame().sendMessage(data, name);
    },

    showProperties : function(record) {
        Ext.getCmp('componentPropertiesPanel').reload(record.get('id'), record.get('name'), record.get('path'));
    },

    hideProperties : function() {
        Ext.getCmp('componentPropertiesPanel').removeAll();
    },

    /**
     * ContextMenu provider
     */
    getMenuActions : function(record, selected) {
        var actions = [];
        var store = this.stores.pageModel;
        var type = record.get('type');
        if (type == HST.CONTAINERITEM) {
            actions.push(new Ext.Action({
                text: this.resources['context-menu-action-delete'],
                handler: function() {
                    this.removeByRecord(record)
                },
                scope: this
            }));
        }
        var children = record.get('children');
        if (type == HST.CONTAINER && children.length > 0) {
            actions.push(new Ext.Action({
                text: this.resources['context-menu-delete-items'],
                handler: function() {
                    var msg = this.resources['context-menu-delete-items-message'].format(children.length);
                    Hippo.Msg.confirm(this.resources['context-menu-delete-items-message-title'], msg, function(btn, text) {
                        if (btn == 'yes') {
                            var r = [children.length];
                            Ext.each(children, function(c) {
                                r.push(store.getAt(store.findExact('id', c)));
                            });
                            //it seems that calling store.remove(r) will end up re-calling the destroy api call for
                            //all previous items in r.. maybe a bug, for now do a loop
                            Ext.each(r, store.remove, store);
                            //store.remove(r);
                        }
                    });
                },
                scope: this
            }));
        }
        return actions;
    },

    removeByRecord: function(record) {
        var store = this.stores.pageModel;
        Hippo.Msg.confirm(this.resources['delete-message-title'], this.resources['delete-message'].format(record.get('name')), function(btn, text) {
            if (btn == 'yes') {
                store.remove(record);
            }
        });
    },

    removeByElement : function(element) {
        var store = this.stores.pageModel;
        var index = store.findExact('id', Ext.fly(element).getAttribute(HST.ATTR.ID));
        this.removeByRecord(store.getAt(index))
    },

    handleEdit : function(uuid) {
        this.fireEvent('edit-document', uuid);
    },

    /**
     * It's not possible to register message:afterselect style listeners..
     * This should work and I'm probably doing something stupid, but I could not
     * get it to work.. So do like this instead.....
     */
    handleFrameMessages : function(frm, msg) {
        var self = this;
        try {
            if (msg.tag == 'rearrange') {
                this.onRearrangeContainer(msg.data.id, msg.data.children);
            } else if (msg.tag == 'onclick') {
                this.handleOnClick(msg.data.element);
            } else if (msg.tag == 'receiveditem') {
                this.handleReceivedItem(msg.data.id, msg.data.element);
            } else if (msg.tag == 'remove') {
                this.removeByElement(msg.data.element);
            } else if (msg.tag == 'afterinit') {
                this.fireEvent('iFrameInitialized', msg.data);
            } else if (msg.tag == 'refresh') {
                this.refreshIframe();
            } else if (msg.tag == 'iframeexception') {
                var errorMsg = this.resources['iframe-event-exception-message-message'];
                if (msg.data.msg) {
                    errorMsg += msg.data.msg;
                }
                if (msg.data.exception) {
                    errorMsg += "\n" + msg.data.exception;
                }
                console.error(errorMsg);
                Hippo.Msg.alert(this.resources['iframe-event-exception-message-title'], this.resources['iframe-event-exception-message-message'], function() {
                    self.initComposer.apply(self, [self.renderHostSubMountPath, self.renderHost]);
                });
            } else if (msg.tag == 'edit-document') {
                this.handleEdit(msg.data.uuid);
            }
        } catch(e) {
            Hippo.Msg.alert(this.resources['iframe-event-handle-error-title'], this.resources['iframe-event-handle-error'].format(msg.tag)+' '+e, function() {
                self.initComposer.apply(self, [self.renderHostSubMountPath, self.renderHost]);
            });
            console.error(e);
        }
    }
});
