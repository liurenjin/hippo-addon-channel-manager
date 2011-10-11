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

Hippo.ChannelManager.TemplateComposer.PageContainer = Ext.extend(Ext.util.Observable, {

    constructor : function(config) {

        this.ignoreRenderHostParameterName = config.ignoreRenderHostParameterName;
        this.resources = config.resources;

        if (config.composerMountUrl.lastIndexOf('/') !== config.composerMountUrl.length - 1) {
            config.composerMountUrl = config.composerMountUrl + '/';
        }
        this.composerMountUrl = config.composerMountUrl;
        this.composerRestMountUrl = config.composerRestMountUrl;

        this.renderHost = config.renderHost;
        this.renderHostSubMountPath = config.renderHostSubMountPath;
        if (this.renderHostSubMountPath.indexOf('/') === 0) {
            this.renderHostSubMountPath = this.renderHostSubMountPath.substr(1);
        }

        this.iFrameErrorPage = config.iFrameErrorPage;
        this.initialHstConnectionTimeout = config.initialHstConnectionTimeout;
        this.iFrameJsHeadContributions = config.iFrameJsHeadContributions;
        this.iFrameCssHeadContributions = config.iFrameCssHeadContributions;

        this.previewMode = true;

        this.iframeCompletion = [];

        this.iframeResourceCache = this._populateIFrameResourceCache();

        this.addEvents(
                'edit-document',
                'lock',
                'unlock'
        );

        Hippo.ChannelManager.TemplateComposer.PageContainer.superclass.constructor.call(this, config);

        // initialized on domready
        this.pageContext = null;

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
    },

    //Keeps the session alive every minute
    _keepAlive : function() {
        Ext.Ajax.request({
            url: this.composerRestMountUrl + 'cafebabe-cafe-babe-cafe-babecafebabe./keepalive?' + this.ignoreRenderHostParameterName + '=true',
            success: function () {
                // Do nothing
            }
        });
    },

    _populateIFrameResourceCache : function() {
        var iframeResources = {
            cache: {},
            css: this.iFrameCssHeadContributions,
            js: this.iFrameJsHeadContributions
        };
        var self = this;
        // clone array with concat()
        var resourceUrls = this.iFrameCssHeadContributions.concat().concat(this.iFrameJsHeadContributions);
        var futures = [];
        for (var i = 0; i < resourceUrls.length; i++) {
            futures[i] = new Hippo.Future(function(success, failure) {
                (function(src) {
                    Ext.Ajax.request({
                        url : src,
                        method : 'GET',
                        success : function(result, request) {
                            iframeResources.cache[src] = result.responseText;
                            success();
                        },
                        failure : function(result, request) {
                            self.fireEvent.apply(self, ['fatalIFrameException', {msg : self.resources['pre-cache-iframe-resources-exception'].format(src)}]);
                            failure();
                        }
                    });
                })(resourceUrls[i]);
            });
        }
        var join = Hippo.Future.join(futures);
        join.set(iframeResources);
        return join;
    },

    // PUBLIC METHODS THAT CHANGE OR RELOAD THE iFrame

    initComposer : function() {
        if (typeof this.renderHostSubMountPath === 'undefined' || typeof this.renderHost === 'undefined' || this.renderHost.trim() === '') {
            return;
        }

        this._lock();

        this._initIFrameListeners();

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
                run: me._keepAlive,
                interval: 60000,
                scope: me
            });
        });
    },

    refreshIframe : function() {
        console.log('refreshIframe');
        var iframe = Ext.getCmp('Iframe');
        var frame = iframe.getFrame();
        var window = frame.getWindow();
        var scrollSave = {x: window.pageXOffset, y: window.pageYOffset};

        this._lock(function() {
            window.scrollBy(scrollSave.x, scrollSave.y);
        });

        iframe.setSrc(iframe.getFrameDocument().location.href); //following links in the iframe doesn't set iframe.src..
    },

    toggleMode: function () {
        this._lock();

        this.previewMode = !this.previewMode;

        var mountId = this.pageContext.ids.mountId;
        var hasPreviewHstConfig = this.pageContext.hasPreviewHstConfig;

        console.log('hasPreviewHstConfig:' + hasPreviewHstConfig);
        if (this.previewMode) {
            var iFrame = Ext.getCmp('Iframe');
            iFrame.getFrame().sendMessage({}, 'hideoverlay');
            this._complete();
        } else {
            if (hasPreviewHstConfig) {
                var iFrame = Ext.getCmp('Iframe');
                iFrame.getFrame().sendMessage({}, ('showoverlay'));
                this._complete();
            } else {
                // create new preview hst configuration
                var self = this;
                Ext.Ajax.request({
                    method: 'POST',
                    url: this.composerRestMountUrl + mountId + './edit?' + this.ignoreRenderHostParameterName + '=true',
                    success: function () {
                        // refresh iframe to get new hst config uuids. previewMode=false will initialize
                        // the editor for editing with the refresh
                        self.refreshIframe.call(self, null);
                    },
                    failure: function(result) {
                        var jsonData = Ext.util.JSON.decode(result.responseText);
                        Hippo.Msg.alert(self.resources['preview-hst-config-creation-failed-title'], self.resources['preview-hst-config-creation-failed'] + ' ' + jsonData.message, function() {
                            self.initComposer.call(self);
                        });
                    }
                });
            }
        }
    },

     publishHstConfiguration : function() {
        this._lock();
        var self = this;
        Ext.Ajax.request({
            method: 'POST',
            url: this.composerRestMountUrl + this.pageContext.ids.mountId + './publish?'+this.ignoreRenderHostParameterName+'=true',
            success: function () {
                self.refreshIframe.call(self, null);
            },
            failure: function(result) {
                var jsonData = Ext.util.JSON.decode(result.responseText);
                Hippo.Msg.alert(self.resources['published-hst-config-failed-message-title'], self.resources['published-hst-config-failed-message']+' '+jsonData.message, function() {
                    self.initComposer.call(self);
                });
            }
        });
    },

    // END PUBLIC METHODS THAT CHANGE THE iFrame

    _lock : function(cb) {
        if (this.iframeCompletion.length == 0) {
            this.fireEvent('lock');
        }
        if (typeof cb === 'function') {
            this.iframeCompletion.unshift(cb);
        }
    },

    _complete : function() {
        console.log('_complete');
        while (this.iframeCompletion.length > 0) {
            var cb = this.iframeCompletion.shift();
            cb.call(this);
        }
        this.fireEvent('unlock', this.pageContext);
    },

    _initIFrameListeners : function() {
        var iFrame = Ext.getCmp('Iframe');
        iFrame.purgeListeners();
        iFrame.on('message', this.handleFrameMessages, this);
        iFrame.on('documentloaded', function(frm) {
            if (Ext.isSafari || Ext.isChrome) {
                this._onIframeDOMReady(frm);
            }
        }, this);
        iFrame.on('domready', function(frm) {
            // Safari && Chrome report a DOM ready event, but js is not yet fully loaded, resulting
            // in 'undefined' errors.
            if (Ext.isGecko || Ext.isIE) {
                this._onIframeDOMReady(frm);
            }
        }, this);
        iFrame.on('exception', function(frm, e) {
            console.error(e);
        }, this);
        iFrame.on('resize', function() {
            this.sendFrameMessage({}, 'resize');
        }, this);
    },

    _onIframeDOMReady : function(frm) {
        this._lock();

        this.frm = frm;

        // disable old page context
        if (this.pageContext != null) {
            this.pageContext.suspendEvents();
        }

        var config = {
            composerMountUrl: this.composerMountUrl,
            composerRestMountUrl: this.composerRestMountUrl,
            renderHostSubMountPath: this.renderHostSubMountPath,
            ignoreRenderHostParameterName: this.ignoreRenderHostParameterName,
            previewMode: this.previewMode,
            resources: this.resources
        };
        this.pageContext = new Hippo.ChannelManager.TemplateComposer.PageContext(
                config, this.iframeResourceCache, this.pageContext, this);
        this.relayEvents(this.pageContext, [
           'mountChanged',
           'iFrameException'
        ]);
        this.pageContext.on('iFrameInitialized', function() {
            this.previewMode = this.pageContext.previewMode;
            this._complete();
        }, this);
        this.pageContext.initialize(frm);
    },

    _onRearrangeContainer: function(rearranges) {
        var self = this;
        var futures = [];

        for (var i=0; i<rearranges.length; i++) {
            (function(rearrange) {
                futures.push(new Hippo.Future(function(onSuccess, onFailure) {
                    window.setTimeout(function() {
                        try {
                            var recordIndex = self.pageContext.stores.pageModel.findExact('id', rearrange.id); //should probably do this through the selectionModel
                            var record = self.pageContext.stores.pageModel.getAt(recordIndex);
                            record.set('children', rearrange.children);
                            console.log('_onRearrangeContainer ' + rearrange.id + ', children: ' + rearrange.children);
                            self.pageContext.stores.pageModel.on('write', function() {
                                onSuccess();
                            }, self, {single: true});
                            record.commit();
                        } catch (exception) {
                            console.error('_onRearrangeContainer ' + exception);
                            onFailure();
                        }
                    }, 0);
                }));
            })(rearranges[i]);
        }

        Hippo.Future.join(futures).when(function() {
            console.log('refresh iframe due to rearranging of containers');
            this.refreshIframe();
        }.createDelegate(this)).otherwise(function() {
            console.error('rearranging containers failed');
        }.createDelegate(this));
    },

    _handleEdit : function(uuid) {
        this.fireEvent('edit-document', uuid);
    },

    _handleReceivedItem : function(containerId, element) {
        //we reload for now so no action here, children value update of containers will take care of it
    },

    sendFrameMessage : function(data, name) {
        Ext.getCmp('Iframe').getFrame().sendMessage(data, name);
    },

    _onClick : function(element) {
        if (element.getAttribute(HST.ATTR.INHERITED)) {
            return;
        }
        var id = element.getAttribute('id');
        var record = this.pageContext.stores.pageModel.getById(id);

        if (!record) {
            console.warn('Handling onClick for element[id=' + id + '] with no record in component store');
            return;
        }

        this.fireEvent('selectItem', record);
    },

    _removeByRecord: function(record) {
        var store = this.pageContext.stores.pageModel;
        var self = this;
        Hippo.Msg.confirm(this.resources['delete-message-title'], this.resources['delete-message'].format(record.get('name')), function(btn, text) {
            if (btn == 'yes') {
                store.on('write', self.refreshIframe, self, {single: true});
                store.remove(record);
            }
        });
    },

    _removeByElement : function(element) {
        var store = this.pageContext.stores.pageModel;
        var index = store.findExact('id', Ext.fly(element).getAttribute(HST.ATTR.ID));
        this._removeByRecord(store.getAt(index))
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
                this._onRearrangeContainer(msg.data);
            } else if (msg.tag == 'onclick') {
                this._onClick(msg.data.element);
            } else if (msg.tag == 'receiveditem') {
                this._handleReceivedItem(msg.data.id, msg.data.element);
            } else if (msg.tag == 'remove') {
                this._removeByElement(msg.data.element);
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
                    self.initComposer.apply(self);
                });
            } else if (msg.tag == 'edit-document') {
                this._handleEdit(msg.data.uuid);
            }
        } catch(e) {
            Hippo.Msg.alert(this.resources['iframe-event-handle-error-title'], this.resources['iframe-event-handle-error'].format(msg.tag)+' '+e, function() {
                self.initComposer.call(self);
            });
            console.error(e);
        }
    }

});
