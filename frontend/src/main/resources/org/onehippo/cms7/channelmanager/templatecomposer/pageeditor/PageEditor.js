/*
 *  Copyright 2010-2015 Hippo B.V. (http://www.onehippo.com)
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
(function() {
    "use strict";

    Ext.namespace('Hippo.ChannelManager.TemplateComposer');

    function invalidatePreviousHstSession(composerRestMountUrl, cmsUser) {
        var url = composerRestMountUrl + '/cafebabe-cafe-babe-cafe-babecafebabe./keepalive/?FORCE_CLIENT_HOST=true';
        Ext.Ajax.request({
            url: url,
            headers: {
                'CMS-User': cmsUser,
                'FORCE_CLIENT_HOST': 'true'
            },
            failure: function(response) {
                console.warn("The SSO handshake with '" + url + "' failed. " +
                        "The channel manager cannot be used. Please make sure the site is up and the channel manager is configured correctly. " +
                        "The server responded: " + response.responseText);
            }
        });
    }

    function swapElements(array, firstIndex, secondIndex) {
        var tmp = array[firstIndex];
        array[firstIndex] = array[secondIndex];
        array[secondIndex] = tmp;
    }

    function moveFirstIfExists(array, element) {
        var index = array.indexOf(element);
        if (index > 0) {
            swapElements(array, 0, index);
        }
    }

    function createChangesForUsersNotificationMessage(userIds, cmsUser, resources) {
        if (userIds.length === 1) {
            if (userIds[0] === cmsUser) {
                return String.format(resources['notification-unpublished-changes-of-cms-user']);
            }
            return String.format(resources['notification-unpublished-changes-of-other-user'], userIds[0]);
        } else {
            if (userIds[0] === cmsUser) {
                userIds[0] = resources['notification-unpublished-changes-cms-user'];
            }
            if (userIds.length === 2) {
                return String.format(resources['notification-unpublished-changes-of-two-users'], userIds[0], userIds[1]);
            }
            return String.format(resources['notification-unpublished-changes-of-comma-separated-users-and-last-one'],
                userIds.slice(0, userIds.length - 1).join(', '), userIds[userIds.length - 1]);
        }
    }

    function stringEndsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    Hippo.ChannelManager.TemplateComposer.GlobalVariantsStore = Ext.extend(Hippo.ChannelManager.TemplateComposer.RestStore, {

        constructor: function(config) {
            this.skipIds = config.skipIds || [];

            var proxy = new Ext.data.HttpProxy({
                api: {
                    read: config.composerRestMountUrl + '/' + config.variantsUuid + './globalvariants/?locale=' + config.locale + '&FORCE_CLIENT_HOST=true',
                    create: '#',
                    update: '#',
                    destroy: '#'
                },
                listeners: {
                    beforewrite: function(proxy, action, records) {
                        return this.api[action].url !== '#';
                    }
                }
            });

            Ext.apply(config, {
                id: 'GlobalVariantsStore',
                proxy: proxy,
                prototypeRecord: [
                    { name: 'id' },
                    { name: 'name' },
                    { name: 'description' },
                    { name: 'group' },
                    { name: 'avatar' },
                    {
                        name: 'comboName',
                        convert: function(value, record) {
                            var comboName = record.name;
                            if (!Ext.isEmpty(record.group)) {
                                comboName += config.resources['variant-name-group-separator'] + ' ' + record.group;
                            }
                            return Ext.util.Format.htmlEncode(comboName);
                        }
                    }
                ],
                listeners: {
                    load: this.filterSkippedIds
                }
            });

            Hippo.ChannelManager.TemplateComposer.GlobalVariantsStore.superclass.constructor.call(this, config);
        },

        filterSkippedIds: function(store) {
            store.filter({
                fn: function(record) {
                    var recordId = record.get('id');
                    return this.skipIds.indexOf(recordId) < 0;
                },
                scope: this
            });
        }

    });

    Hippo.ChannelManager.TemplateComposer.API = Ext.extend(Ext.util.Observable, {

        constructor: function(config) {
            Hippo.ChannelManager.TemplateComposer.API.superclass.constructor.call(this, config);
            this.pageContainer = config.pageContainer;
            this.addEvents('variantselected');
        },

        selectedVariant: function(variant) {
            this.fireEvent('variantselected', variant);
        },

        refreshIFrame: function() {
            this.pageContainer.refreshIframe();
        },

        isPreviewMode: function() {
            return this.pageContainer.previewMode;
        }

    });

    Hippo.ChannelManager.TemplateComposer.PageEditor = Ext.extend(Ext.Panel, {

        // height of the toolbar (in pixels)
        TOOLBAR_HEIGHT: 42,
        variantsUuid: null,
        locale: null,
        fullscreen: false,

        constructor: function(config) {
            if (config.extAjaxTimeout) {
                Ext.Ajax.timeout = config.extAjaxTimeout;
                console.log("Set Ext.Ajax.timeout to " + config.extAjaxTimeout + " ms.");
            }
            this.title = config.title;
            this.resources = config.resources;
            this.cmsUser = config.cmsUser;
            this.antiCache = config.ANTI_CACHE;

            config.header = false;
            config.cls = 'page-editor-panel';
            config.border = false;

            this.variantsUuid = config.variantsUuid;
            this.pageContainer = new Hippo.ChannelManager.TemplateComposer.PageContainer(config);
            this.locale = config.locale;
            this.hideHstConfigEditor = config.hideHstConfigEditor;
            this.canManageChanges = config.canManageChanges;
            this.toolbarPlugins = config.toolbarPlugins;

            this.templateComposerApi = new Hippo.ChannelManager.TemplateComposer.API({
                pageContainer: this.pageContainer
            });

            this.globalVariantsStore = null;
            this.globalVariantsStoreFuture = null;
            if (Ext.isDefined(this.variantsUuid)) {
                this.globalVariantsStore = new Hippo.ChannelManager.TemplateComposer.GlobalVariantsStore({
                    composerRestMountUrl: this.pageContainer.getComposerRestMountUrl(),
                    locale: this.locale,
                    resources: config.resources,
                    variantsUuid: this.variantsUuid
                });
                this.globalVariantsStoreFuture = new Hippo.Future(function(success, fail) {
                    this.globalVariantsStore.on('load', function() {
                        success(this.globalVariantsStore);
                    }, {single: true});
                    this.globalVariantsStore.on('exception', fail, {single: true});
                }.createDelegate(this));
            } else {
                this.globalVariantsStore = new Ext.data.ArrayStore({
                    fields: [
                        'id', 'name', 'avatar'
                    ]
                });
                this.globalVariantsStoreFuture = new Hippo.Future(function(success, fail) {
                    this.globalVariantsStore.on('load', function() {
                        success(this.globalVariantsStore);
                    }, {single: true});
                    this.globalVariantsStore.on('exception', fail, {single: true});
                    this.globalVariantsStore.loadData([
                        ['hippo-default', 'Default', 'hippo-default']
                    ]);
                }.createDelegate(this));
            }

            invalidatePreviousHstSession(this.pageContainer.getComposerRestMountUrl(), config.cmsUser);

            this.initUI(config);

            Hippo.ChannelManager.TemplateComposer.PageEditor.superclass.constructor.call(this, config);

            this.on('titlechange', function(panel, title) {
                this.title = title;
            });

            this.on('activate', function () {
                this.refreshIframe();
            }, this);

            this.relayEvents(this.pageContainer, [
                'mountChanged',
                'selectItem',
                'lock',
                'unlock',
                'edit-document',
                'documents',
                'previewCreated'
            ]);
        },

        areVariantsEnabled: function() {
            return (this.globalVariantsStore instanceof Hippo.ChannelManager.TemplateComposer.GlobalVariantsStore);
        },

        initUI: function(config) {
            Ext.apply(config, {
                items: [
                    {
                        id: 'pageEditorIFrame',
                        xtype: 'Hippo.ChannelManager.TemplateComposer.IFramePanel',
                        hidden: true,
                        tbar: {
                            id: 'pageEditorToolbar',
                            border: false,
                            cls: 'channel-manager-toolbar',
                            height: this.TOOLBAR_HEIGHT,
                            items: []
                        }
                    },
                    {
                        id: 'channelChangesNotification',
                        xtype: 'Hippo.ChannelManager.TemplateComposer.Notification',
                        alignToElementId: 'pageEditorToolbar',
                        message: ''
                    },
                    {
                        id: 'icon-toolbar-window',
                        xtype: 'Hippo.ChannelManager.TemplateComposer.IconToolbarWindow',
                        alignToElementId: 'pageEditorToolbar',
                        resources: config.resources,
                        defaultIconUrl: config.defaultToolkitIconUrl
                    }
                ]
            });
        },

        getFullScreenButtonConfig: function(fullscreen) {
            return {
                xtype: 'button',
                id: 'template-composer-toolbar-fullscreen-button',
                iconCls: fullscreen ? 'expand' : 'collapse',
                listeners: {
                    click: {
                        fn: function(button) {
                            this.fullscreen = fullscreen;
                            this.createViewToolbar();
                            this.registerResizeListener();
                            Ext.getCmp('pageEditorIFrame').hostToIFrame.publish(fullscreen ? 'fullscreen' : 'partscreen');
                        },
                        scope: this
                    }
                }
            };
        },

        createVariantsComboBox: function() {
            var self, variantsComboBox;
            self = this;
            variantsComboBox = new Ext.form.ComboBox({
                id: 'template-composer-toolbar-variants-combo',
                store: this.globalVariantsStore,
                displayField: 'comboName',
                valueField: 'id',
                valueNotFoundText: ' ',
                typeAhead: true,
                mode: 'remote',
                triggerAction: 'all',
                emptyText: this.resources['variants-combo-box-empty-text'],
                editable: false,
                selectOnFocus: true,
                autoSelect: true,
                hidden: !this.areVariantsEnabled(), // hide when only default is available
                tpl: '<tpl for="."><div class="x-combo-list-item template-composer-variant-{id}" ext:qtip="{comboName}{[ Ext.isEmpty(values.description) ? "" : ":<br>&quot;" + fm.htmlEncode(values.description) + "&quot;" ]}">{comboName}</div></tpl>',
                listeners: {
                    scope: this,
                    beforequery: function(queryEvent) {
                        // remove the lastQuery property to force a reload of the store
                        delete queryEvent.combo.lastQuery;
                    },
                    beforeselect: function(combo, record) {
                        var variant = record.get('id');
                        if (variant === combo.getValue()) {
                            return false;
                        }
                        Ext.Ajax.request({
                            url: self.pageContainer.getComposerRestMountUrl() + '/cafebabe-cafe-babe-cafe-babecafebabe./setvariant?FORCE_CLIENT_HOST=true',
                            method: 'POST',
                            headers: {
                                'FORCE_CLIENT_HOST': 'true'
                            },
                            params: {
                                'variant': variant
                            },
                            success: function() {
                                self.refreshIframe.call(self);
                            },
                            failure: function() {
                                console.log("Failed to set variant '" + variant + "'");
                                combo.clearValue();
                            }
                        });
                    },
                    select: function(combo, record) {
                        var variant = record.get('id');
                        this.templateComposerApi.selectedVariant(variant);
                    }
                }
            });

            variantsComboBox.on('afterRender', function() {
                variantsComboBox.setValue(this.renderedVariant);
                this.globalVariantsStoreFuture.when(function() {
                    var selectVariant = this.globalVariantsStore.indexOfId(this.renderedVariant) >= 0 ? this.renderedVariant : 'hippo-default';
                    variantsComboBox.setValue(selectVariant);
                    this.templateComposerApi.selectedVariant(selectVariant);
                }.createDelegate(this));
            }, this);

            return variantsComboBox;
        },

        clearToolbar: function() {
            var toolbar = Ext.getCmp('pageEditorToolbar');

            toolbar.removeAll();
            toolbar.doLayout();
        },

        createVariantLabel: function() {
            return new Ext.Toolbar.TextItem({
                id: 'template-composer-toolbar-variants-label',
                text: this.resources['variants-combo-box-label'],
                hidden: !this.areVariantsEnabled() // hide when only default is available
            });
        },

        createViewToolbar: function() {
            var toolbar = Ext.getCmp('pageEditorToolbar'),
                    variantsComboBoxLabel = this.createVariantLabel(),
                    variantsComboBox = this.createVariantsComboBox(),
                    toolbarButtons;

            toolbar.removeAll();

            if (this.fullscreen) {
                toolbar.add(
                        '->',
                        variantsComboBoxLabel,
                        variantsComboBox,
                        this.getFullScreenButtonConfig(false)
                );
            } else {
                toolbarButtons = this.getToolbarButtons();

                if (this.pageContainer.canEdit) {
                    toolbar.add(
                        toolbarButtons.edit,
                        toolbarButtons.publish,
                        toolbarButtons.discard,
                        toolbarButtons.manageChanges,
                        ' '
                    );
                }
                toolbar.add(
                    this.createPagesButton(),
                    '->',
                    variantsComboBoxLabel,
                    variantsComboBox,
                    this.getFullScreenButtonConfig(true)
                );
            }
            this.addToolbarPlugins(toolbar, 'view');
            if (toolbar.rendered) {
                toolbar.doLayout();
            }
            this.updateChannelChangesNotification();
        },

        showOrHideButtons: function (button1, button2) {

            var show = false;
            if (this.channel.previewHstConfigExists === "true" && this.channel.changedBySet.indexOf(this.cmsUser) > -1) {
                show = true;
            }

            if (show) {
                if (button1) {
                    button1.show();
                }
                if (button2) {
                    button2.show();
                }
            } else {
                if (button1) {
                    button1.hide();
                }
                if (button2) {
                    button2.hide();
                }
            }
        },

        createEditToolbar: function() {
            var toolbar = Ext.getCmp('pageEditorToolbar'),
                    variantsComboBoxLabel = this.createVariantLabel(),
                    variantsComboBox = this.createVariantsComboBox(),
                    toolboxVisible = Ext.get('icon-toolbar-window').isVisible();



            toolbar.removeAll();
            toolbar.add(
                    {
                        id: 'template-composer-toolbar-save-and-close-button',
                        text: this.initialConfig.resources['close-button'],
                        iconCls: 'save-close-channel',
                        allowDepress: false,
                        listeners: {
                            click: {
                                fn: this.pageContainer.toggleMode,
                                scope: this.pageContainer
                            }
                        }
                    },
                    {
                        id: 'template-composer-toolbar-discard-button',
                        text: this.initialConfig.resources['discard-my-button'],
                        iconCls: 'discard-channel',
                        allowDepress: false,
                        hidden: true,
                        listeners: {
                            click: {
                                fn: function() {
                                    this.pageContainer.discardChanges().when(function() {
                                        this.fireEvent('channelChanged');
                                    }.createDelegate(this));
                                },
                                scope: this
                            }
                        }
                    },
                    this.createPagesButton(),
                    {
                        id: 'template-composer-toolbar-page-settings-button',
                        text: this.initialConfig.resources['page-settings-button'],
                        mode: 'show',
                        iconCls: 'page-settings',
                        listeners: {
                            click: {
                                fn: this.showPageSettings,
                                scope: this
                            }
                        }
                    },
                    {
                        id: 'template-composer-toolbar-channel-properties-button',
                        text: this.initialConfig.resources['show-channel-properties-button'],
                        mode: 'show',
                        iconCls: 'channel-settings',
                        allowDepress: false,
                        listeners: {
                            click: {
                                fn: function(button) {
                                    var propertiesWindow = Ext.getCmp('channel-properties-window');
                                    if (button.mode === 'show') {
                                        propertiesWindow.show({
                                            channelId: this.channelId,
                                            channelName: this.channelName,
                                            cmsUser: this.cmsUser,
                                            channelNodeLockedBy: this.channel.channelNodeLockedBy
                                        });
                                        propertiesWindow.on('hide', function() {
                                            button.mode = 'show';
                                            button.setText(this.initialConfig.resources['show-channel-properties-button']);
                                        }, this, {single: true});
                                        button.mode = 'hide';
                                        button.setText(this.initialConfig.resources['close-channel-properties-button']);
                                    } else {
                                        propertiesWindow.hide();
                                        button.mode = 'show';
                                        button.setText(this.initialConfig.resources['show-channel-properties-button']);
                                    }
                                },
                                scope: this
                            }
                        }
                    },
                    {
                        id: 'template-composer-toolbar-components-button',
                        text: (toolboxVisible ? this.initialConfig.resources['close-components-button'] : this.initialConfig.resources['add-components-button']),
                        mode: (toolboxVisible ? 'hide' : 'show'),
                        allowDepress: false,
                        iconCls: 'add-components',
                        listeners: {
                            click: {
                                fn: function(button) {
                                    var toolkitWindow = Ext.getCmp('icon-toolbar-window');
                                    if (button.mode === 'show') {
                                        toolkitWindow.show();
                                        button.mode = 'hide';
                                        button.setText(this.initialConfig.resources['close-components-button']);
                                    } else {
                                        toolkitWindow.hide();
                                        button.mode = 'show';
                                        button.setText(this.initialConfig.resources['add-components-button']);
                                    }
                                },
                                scope: this
                            }
                        }
                    },
                    '->',
                    variantsComboBoxLabel,
                    variantsComboBox,
                    {
                        id: 'template-composer-toolbar-gear-menu',
                        cls: 'toolbarMenuIcon',
                        iconCls: 'channel-gear',
                        hidden: this.hideHstConfigEditor,
                        listeners: {
                            click: {
                                fn: function() {
                                    this.fireEvent('edit-hst-config', this.channelId, this.hstMountPoint);
                                },
                                scope: this
                            }
                        }
                    }
            );
            this.addToolbarPlugins(toolbar, 'edit');
            if (toolbar.rendered) {
                toolbar.doLayout();
            }

            this.showOrHideButtons(Ext.getCmp('template-composer-toolbar-discard-button'));
        },

        addToolbarPlugins: function(toolbar, mode) {
            Ext.each(this.toolbarPlugins, function(plugin) {
                var insertIndex, pluginInstance;

                if (plugin.positions[mode] !== 'hidden') {
                    insertIndex = this.parseToolbarInsertIndex(toolbar, plugin, mode);
                    if (insertIndex >= 0) {
                        console.log("Adding " + mode + " toolbar plugin '" + plugin.xtype + "' " + plugin.positions[mode]);
                        pluginInstance = Hippo.ExtWidgets.create(plugin.xtype, {
                            templateComposer: this.templateComposerApi,
                            toolbarMode: mode,
                            channel: this.channel
                        });
                        toolbar.insert(insertIndex, pluginInstance);
                    }
                }
            }, this);
        },

        parseToolbarInsertIndex: function(toolbar, plugin, mode) {
            var spaceIndex, beforeOrAfter, neighborId, neighbor, insertIndex;

            if (plugin.positions[mode] === 'first') {
                return 0;
            }
            if (plugin.positions[mode] === 'last') {
                return toolbar.items.getCount();
            }

            spaceIndex = plugin.positions[mode].indexOf(' ');
            beforeOrAfter = plugin.positions[mode].substring(0, spaceIndex);

            if (spaceIndex < 0 || (beforeOrAfter !== 'before' && beforeOrAfter !== 'after')) {
                console.warn("Ignoring toolbar plugin '" + plugin.xtype + "', unknown position: '" + plugin.positions[mode]
                        + "'. Expected 'before <toolbar-item-id>' or 'after <toolbar-item-id>'");
                return -1;
            }

            insertIndex = -1;
            neighborId = plugin.positions[mode].substring(spaceIndex + 1);

            toolbar.items.each(function(toolbarItem, index) {
                if (toolbarItem.id === neighborId) {
                    insertIndex = beforeOrAfter === 'before' ? index : index + 1;
                    return false;
                }
            }, this);

            if (insertIndex === -1) {
                console.warn("Ignoring toolbar plugin '" + plugin.xtype + "', unknown neighbor: '" + neighborId
                        + "'. Known neighbors are: " + Ext.pluck(toolbar.items.items, 'id').toString());
            }

            return insertIndex;
        },

        enableUI: function(pageContext) {
            var hostToIFrame, toolkitGrid, toolbar;

            hostToIFrame = Ext.getCmp('pageEditorIFrame').hostToIFrame;

            Hippo.Msg.hide();

            // exception occurred during loading: hide everything
            if (pageContext === null) {
                this.clearToolbar();
                if (this.propertiesWindow) {
                    this.propertiesWindow.hide();
                }
                return;
            }

            this.renderedVariant = pageContext.renderedVariant;
            this.currentMountId = pageContext.ids.mountId;
            this.currentSitemapId = pageContext.ids.sitemapId;
            this.currentSitemapItemId = pageContext.ids.sitemapItemId;

            if (!this.pageContainer.previewMode) {
                this.createEditToolbar();

                hostToIFrame.publish('showoverlay');
                hostToIFrame.publish('hide-edit-content-buttons');
                hostToIFrame.publish('show-edit-menu-buttons');

                if (this.propertiesWindow) {
                    this.propertiesWindow.destroy();
                }
                this.propertiesWindow = this.createPropertiesWindow(pageContext.ids.mountId);
                this.propertiesWindow.hide();

                toolkitGrid = Ext.getCmp('ToolkitGrid');
                toolkitGrid.reconfigure(pageContext.stores.toolkit, toolkitGrid.getColumnModel());

                this.hideChannelChangesNotification();
            } else {
                this.createViewToolbar();

                hostToIFrame.publish('hideoverlay');
                hostToIFrame.publish('hide-edit-menu-buttons');
                if (this.fullscreen) {
                    hostToIFrame.publish('hide-edit-content-buttons');
                } else {
                    hostToIFrame.publish('show-edit-content-buttons');
                }

                if (this.propertiesWindow) {
                    this.propertiesWindow.hide();
                }

                this.updateChannelChangesNotification();

                Ext.getCmp('icon-toolbar-window').hide();
            }

            Ext.getCmp('pageEditorIFrame').show();
        },

        updateChannelChangesNotification: function() {
            var iframe;

            if (this.pageContainer.pageContext !== null) {
                iframe = Ext.getCmp('pageEditorIFrame');
                if (iframe.isVisible()) {
                    this.showOrHideChannelChangesNotification(this.fullscreen, this.pageContainer.pageContext);
                } else {
                    iframe.on('show', function() {
                        this.showOrHideChannelChangesNotification(this.fullscreen, this.pageContainer.pageContext);
                    }, this, {single: true});
                }
            }
        },

        showOrHideChannelChangesNotification: function(fullscreen, pageContext) {
            if (fullscreen || !pageContext.hasPreviewHstConfig) {
                this.hideChannelChangesNotification();
                return;
            }
            this.showChannelChangesNotification(pageContext);
        },

        showChannelChangesNotification: function(pageContext) {
            var notification, userIds;
            notification = Ext.getCmp('channelChangesNotification');
            if (this.channel.changedBySet.length === 0) {
                notification.hide();
            } else {
                // don't reorder the changedBySet, hence first clone it
                userIds = this.channel.changedBySet.slice(0);
                moveFirstIfExists(userIds, this.cmsUser);
                notification.setMessage(createChangesForUsersNotificationMessage(userIds, this.cmsUser, this.resources));
                notification.show();
            }
        },

        hideChannelChangesNotification: function() {
            Ext.getCmp('channelChangesNotification').hide();
        },

        disableUI: function() {
            var toolbar, channelPropertiesWindow;

            toolbar = Ext.getCmp('pageEditorToolbar');
            toolbar.items.each(function(item) {
                item.disable();
            });

            channelPropertiesWindow = Ext.getCmp('channel-properties-window');
            if (channelPropertiesWindow) {
                channelPropertiesWindow.hide();
            }
        },

        registerResizeListener: function() {
            var yuiLayout,
                    element,
                    domNode = this.getEl().dom,
                    relayout = false,
                    rootPanel = Ext.getCmp('rootPanel'),
                    iframe = Ext.getCmp('pageEditorIFrame'),
                    location;

            if (this.fullscreen) {
                location = iframe.getLocation();

                this.getEl().addClass("channel-manager-fullscreen");
                this.getEl().addClass("channel-manager");
                yuiLayout = this.getEl().findParent("div.yui-layout-unit");
                YAHOO.hippo.LayoutManager.unregisterResizeListener(yuiLayout, this, this.resizeListener);

                iframe.suspendEvents();
                rootPanel.remove(this, false);
                Ext.getBody().dom.appendChild(domNode);
                iframe.resumeEvents();

                iframe.setLocation(location);

                element = Ext.getBody();
                this.resizeListener = function() {
                    var w = element.getWidth(), h = element.getHeight();
                    this.setSize(w, h);

                    // The height of the yui layout div also includes the space for the toolbar, so subtract that.
                    iframe.setSize(w, h);
                }.createDelegate(this);
                YAHOO.hippo.LayoutManager.registerRootResizeListener(this, this.resizeListener);

                this.resizeListener();
            } else {
                if (this.resizeListener) {
                    YAHOO.hippo.LayoutManager.unregisterRootResizeListener(this.resizeListener);

                    location = iframe.getLocation();

                    iframe.suspendEvents();
                    Ext.getBody().dom.removeChild(domNode);
                    rootPanel.insert(1, this);
                    iframe.resumeEvents();

                    rootPanel.getLayout().setActiveItem(1);
                    rootPanel.doLayout();

                    iframe.setLocation(location);

                    relayout = true;
                }

                element = this.getEl();
                element.removeClass("channel-manager");
                element.removeClass("channel-manager-fullscreen");
                yuiLayout = element.findParent("div.yui-layout-unit");
                this.resizeListener = function(sizes) {
                    iframe.setSize(sizes.body.w, sizes.body.h);
                };
                YAHOO.hippo.LayoutManager.registerResizeListener(yuiLayout, this, this.resizeListener, true);

                if (relayout) {
                    this.resizeListener(YAHOO.hippo.LayoutManager.findLayoutUnit(yuiLayout).getSizes());
                }
            }
        },

        initComponent: function() {
            Hippo.ChannelManager.TemplateComposer.PageEditor.superclass.initComponent.call(this);

            // recalculate the ExtJs layout when the YUI layout manager fires a resize event
            this.on('afterrender', function() {
                this.registerResizeListener();
            }, this, {single: true});

            this.on('lock', function() {
                this.disableUI();
            }, this);

            this.on('unlock', function(pageContext) {
                if (pageContext !== null) {
                    Hippo.ChannelManager.TemplateComposer.DragDropOne.setPageContext(pageContext);
                }
                this.enableUI(pageContext);
            }, this);

            this.on('previewCreated', function() {
                var self = this,
                    previewChannelId;
                if (!stringEndsWith(this.channelId, "-preview")) {
                    previewChannelId = this.channelId + "-preview";
                    this.channelId = null;
                    this.channelStoreFuture.when(function(config) {
                        config.store.on('load', function() {
                            self.browseTo({ channelId: previewChannelId, isEditMode: true });
                        }, this, { single: true });
                        config.store.reload();
                    });
                } else {
                    this.pageContainer.refreshIframe.call(this.pageContainer);
                }
            }, this);

            this.on('selectItem', function(record, forcedVariant, containerDisabled) {
                if (record.get('type') === HST.CONTAINERITEM && containerDisabled !== true) {
                    this.showProperties(record, forcedVariant);
                }
            }, this);

            this.pageContainer.on('edit-menu', this.editMenu, this);

            this.on('mountChanged', function(data) {
                this.channelStoreFuture.when(function(config) {
                    var collection = config.store.query('mountId', data.mountId),
                        channelRecord = collection.first();
                    if (typeof this.showTitleSwitchTimeout !== 'undefined') {
                        window.clearTimeout(this.showTitleSwitchTimeout);
                    }
                    this.setTitle(channelRecord.get('name'));
                    this.channelId = channelRecord.get('id');
                    this.channelName = channelRecord.get('name');
                    this.channel = channelRecord.data;
                }.createDelegate(this));
            }, this);

            this.channelStoreFuture.when(function(config) {
                config.store.on('load', function() {
                    if (this.channelId) {
                        var channelRecord = config.store.getById(this.channelId);

                        this.channel = channelRecord.data;
                        if (this.pageContainer.previewMode) {
                            this.createViewToolbar();
                        } else {
                            this.createEditToolbar();
                        }
                    }
                }, this);
                this.on('channelChanged', function() {
                    config.store.reload();
                }, this);
            }.createDelegate(this));
        },

        createPropertiesWindow: function(mountId) {
            var width, propertiesPanel, window;

            width = Ext.isDefined(this.variantsUuid) ? 530 : 400;
            propertiesPanel = new Hippo.ChannelManager.TemplateComposer.PropertiesPanel({
                id: 'componentPropertiesPanel',
                resources: this.resources,
                locale: this.locale,
                composerRestMountUrl: this.pageContainer.getComposerRestMountUrl(),
                variantsUuid: this.variantsUuid,
                globalVariantsStore: this.globalVariantsStore,
                globalVariantsStoreFuture: this.globalVariantsStoreFuture,
                mountId: mountId,
                listeners: {
                    'save': function() {
                        this.fireEvent('channelChanged');
                    },
                    'close': function() {
                        window.hide();
                    },
                    'delete': function() {
                        this.fireEvent('channelChanged');
                    },
                    'variantChange': function(id, variantId) {
                        if (id !== null) {
                            this.selectVariant(id, variantId);
                        }
                    },
                    'propertiesChanged': function(componentId, propertiesMap) {
                        this.renderComponentProperties(componentId, propertiesMap);
                    },
                    scope: this
                }
            });

            window = new Hippo.ux.window.FloatingWindow({
                id: 'componentPropertiesWindow',
                title: this.resources['properties-window-default-title'],
                x: 10, y: 120,
                width: width,
                height: 350,
                layout: 'fit',
                closable: true,
                closeAction: 'hide',
                collapsible: false,
                constrainHeader: true,
                bodyStyle: 'background-color: #ffffff',
                cls: "component-properties",
                renderTo: Ext.getCmp('pageEditorIFrame').getEl(),
                constrain: true,
                hidden: true,
                listeners: {
                    hide: function() {
                        this.pageContainer.deselectComponents();
                        propertiesPanel.selectInitialVariant();
                    },
                    scope: this
                },
                items: [ propertiesPanel ]
            });

            // Adapt the size of the window to the visible height of the properties panel.
            propertiesPanel.on('visibleHeightChanged', function(visibleHeight) {
                var currentWindowHeight = window.getHeight(),
                    visibleWindowHeight = visibleHeight + window.getFrameHeight(),
                    maxWindowHeight = Hippo.ChannelManager.TemplateComposer.Instance.getHeight(),
                    newWindowHeight = Math.min(visibleWindowHeight, maxWindowHeight);
                if (currentWindowHeight !== newWindowHeight) {
                    window.setHeight(newWindowHeight);
                }
            });

            // Enable mouse events in the iframe while the properties window is dragged. When the mouse pointer is moved
            // quickly it can end up outside the window above the iframe. The iframe should then send mouse events back
            // to the host in order to update the position of the dragged window.
            window.on('startdrag', function() {
                Ext.getCmp('pageEditorIFrame').hostToIFrame.publish('enablemouseevents');
            });
            window.on('enddrag', function() {
                Ext.getCmp('pageEditorIFrame').hostToIFrame.publish('disablemouseevents');
            });

            return window;
        },

        showProperties: function(record, forcedVariant) {
            var componentPropertiesPanel = Ext.getCmp('componentPropertiesPanel'),
                componentId = record.get('id'),
                pageRequestVariants = this.pageContainer.pageContext.pageRequestVariants,
                lastModifiedTimestamp = record.get('lastModifiedTimestamp');
            componentPropertiesPanel.load(componentId, forcedVariant, pageRequestVariants, lastModifiedTimestamp);
            if (this.propertiesWindow) {
                this.propertiesWindow.setTitle(record.get('name'));
                this.propertiesWindow.show();
            }
        },

        refreshIframe: function() {
            this.pageContainer.refreshIframe.call(this.pageContainer);
            this.fireEvent('channelChanged');
        },

        initComposer: function(isEditMode) {
            this.pageContainer.initComposer.call(this.pageContainer, isEditMode).when(function() {
                if (this.areVariantsEnabled()) {
                    this.globalVariantsStore.load();
                }
            }.createDelegate(this));
        },

        browseTo: function(data) {
            this.channelStoreFuture.when(function(config) {
                var isEditMode, record;
                if (Ext.isDefined(data.isEditMode)) {
                    isEditMode = data.isEditMode;
                } else if (Ext.isDefined(data.channelId) && data.channelId !== this.channelId) {
                    isEditMode = false;
                } else {
                    isEditMode = this.pageContainer ? !this.pageContainer.previewMode : false;
                }

                this.channelId = data.channelId || this.channelId;
                record = config.store.getById(this.channelId);
                this.title = record.get('name');
                this.channel = record.data;
                this.hstMountPoint = record.get('hstMountPoint');
                this.pageContainer.contextPath = record.get('contextPath') || data.contextPath || this.contextPath;
                this.pageContainer.cmsPreviewPrefix = record.get('cmsPreviewPrefix') || data.cmsPreviewPrefix || this.cmsPreviewPrefix;
                this.pageContainer.renderPathInfo = data.renderPathInfo || this.renderPathInfo || record.get('mountPath');
                this.pageContainer.renderHost = record.get('hostname');
                Ext.getCmp('pageEditorIFrame').hide();
                this.initComposer(isEditMode);
            }.createDelegate(this));
        },

        mask: function() {
            this.body.addClass(['channel-manager-mask', 'ext-el-mask']);
            Ext.getCmp('pageEditorIFrame').mask();
        },

        unmask: function() {
            this.body.removeClass(['channel-manager-mask', 'ext-el-mask']);
            Ext.getCmp('pageEditorIFrame').unmask();
        },

        selectVariant: function(id, variant) {
            this.pageContainer.pageContext.selectVariant(id, variant);
        },

        renderComponentProperties: function(id, propertiesMap) {
            this.pageContainer.pageContext.renderComponentProperties(id, propertiesMap);
        },

        editMenu: function(uuid) {
            var editMenuWindow = new Hippo.ChannelManager.TemplateComposer.EditMenuWindow({
                resources: this.resources,
                composerRestMountUrl: this.pageContainer.getComposerRestMountUrl(),
                debug: this.debug,
                locale: this.locale,
                menuId: uuid,
                antiCache: this.antiCache
            });
            editMenuWindow.on('close', this.refreshIframe, this);
            editMenuWindow.show();
        },

        showPages: function() {
            var pagesWindow = new Hippo.ChannelManager.TemplateComposer.PagesWindow({
                resources: this.resources,
                composerRestMountUrl: this.pageContainer.getComposerRestMountUrl(),
                debug: this.debug,
                locale: this.locale,
                mountId: this.currentMountId,
                sitemapId: this.currentSitemapId,
                userCanEdit: this.pageContainer.canEdit,
                userIsEditing: !this.pageContainer.previewMode,
                antiCache: this.antiCache
            });
            pagesWindow.show();
        },

        showPageSettings: function() {
            var pageSettingsWindow = new Hippo.ChannelManager.TemplateComposer.PageSettingsWindow({
                resources: this.resources,
                cmsUser: this.cmsUser,
                composerRestMountUrl: this.pageContainer.getComposerRestMountUrl(),
                debug: this.debug,
                locale: this.locale,
                mountId: this.currentMountId,
                sitemapId: this.currentSitemapId,
                sitemapItemId: this.currentSitemapItemId,
                antiCache: this.antiCache
            });
            pageSettingsWindow.show();
        },

        createPagesButton: function() {
            return new Ext.Toolbar.Button({
                id: 'template-composer-toolbar-pages-button',
                text: this.initialConfig.resources['pages-button'],
                iconCls: 'btn-pages',
                listeners: {
                    click: {
                        fn: this.showPages,
                        scope: this
                    }
                }
            });
        },

        getToolbarButtons: function() {
            var editButton, publishButton, discardButton, manageChangesButton;
            editButton = new Ext.Toolbar.Button({
                id: 'template-composer-toolbar-edit-button',
                text: this.initialConfig.resources['edit-button'],
                iconCls: 'edit-channel',
                listeners: {
                    click: {
                        fn: this.pageContainer.toggleMode,
                        scope: this.pageContainer
                    }
                }
            });
            publishButton = new Ext.Toolbar.Button({
                id: 'template-composer-toolbar-publish-button',
                text: this.initialConfig.resources['publish-my-button'],
                iconCls: 'publish-channel',
                hidden: true,
                listeners: {
                    click: {
                        fn: function() {
                            this.pageContainer.publishHstConfiguration().when(function() {
                                this.fireEvent('channelChanged');
                            }.createDelegate(this));
                        },
                        scope: this
                    }
                }
            });
            discardButton = new Ext.Toolbar.Button({
                id: 'template-composer-toolbar-discard-button',
                text: this.initialConfig.resources['discard-my-button'],
                iconCls: 'discard-channel',
                hidden: true,
                listeners: {
                    click: {
                        fn: function() {
                            this.pageContainer.discardChanges().when(function() {
                                this.fireEvent('channelChanged');
                            }.createDelegate(this));
                        },
                        scope: this
                    }
                }
            });
            manageChangesButton = new Ext.Toolbar.Button({
                id: 'template-composer-toolbar-manage-changes-button',
                text: this.initialConfig.resources['manage-changes-button'],
                iconCls: 'publish-channel',
                hidden: !this.canManageChanges || this.channel.changedBySet.length === 0,
                listeners: {
                    click: {
                        fn: function() {
                            this.pageContainer.manageChanges().when(function() {
                                this.fireEvent('channelChanged');
                            }.createDelegate(this));
                        },
                        scope: this
                    }
                }
            });
            this.showOrHideButtons(Ext.getCmp('template-composer-toolbar-publish-button'),
                    Ext.getCmp('template-composer-toolbar-discard-button'));

            return {
                edit: editButton,
                publish: publishButton,
                discard: discardButton,
                manageChanges: manageChangesButton
            };
        }

    });

}());