/**
 * Copyright 2011 Hippo
 *
 * Licensed under the Apache License, Version 2.0 (the  "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

Ext.namespace('Hippo.ChannelManager');

/**
 * @class Hippo.ChannelManager.RootPanel
 * @extends Ext.Panel
 */
Hippo.ChannelManager.RootPanel = Ext.extend(Ext.Panel, {
            constructor: function(config) {
                this.channelStore = config.channelStore;
                this.blueprintStore = config.blueprintStore;
                Hippo.ChannelManager.RootPanel.superclass.constructor.call(this, config);
            },

            initComponent: function() {
                var me = this;
                var config = {
                    layout: 'border',
                    height: 900,
                    title: "Channel Manager",
                    tbar: [
                        {
                            text: "New Channel",
                            handler: me.openChannelWizard,
                            scope: me
                        }
                    ],
                    viewConfig: {
                        forceFit: true
                    }

                };

                Ext.apply(this, Ext.apply(this.initialConfig, config));

                Hippo.ChannelManager.RootPanel.superclass.initComponent.apply(this, arguments);
            },

            openChannelWizard:function() {
                var win = new Hippo.ChannelManager.NewChannelWindow({
                            blueprintStore: this.blueprintStore,
                            channelStore : this.channelStore
                        });
                win.show();
            }
        });

Ext.reg('Hippo.ChannelManager.RootPanel', Hippo.ChannelManager.RootPanel);


Hippo.ChannelManager.NewChannelWindow = Ext.extend(Ext.Window, {
            constructor: function(config) {
                this.blueprintStore = config.blueprintStore;
                this.channelStore = config.channelStore;

                Hippo.ChannelManager.NewChannelWindow.superclass.constructor.call(this, config);
            },

            initComponent: function() {
                var me = this;

                var config = {
                    title: "New Channel",
                    width: 720,
                    height: 450,
                    modal: true,
                    resizable: false,
                    layout: 'card',
                    activeItem: 0,
                    items: [
                        {
                            id: 'form-panel',
                            html: "<h1>Blue PrintListing Panel</h1>"
                        },
                        {
                            id: 'properties',
                            html: "<h1>Channel Mandatory Properties Panel</h1>"
                        }

                    ],
                    buttons: [
                        {
                            text: 'Next',
                            scope: me,
                            handler: me.processNextStep
                        },
                        {
                            text: 'Cancel',
                            scope: this,
                            handler: function() {
                                this.close();
                            }
                        }
                    ]

                };

                Ext.apply(this, Ext.apply(this.initialConfig, config));

                Hippo.ChannelManager.NewChannelWindow.superclass.initComponent.apply(this, arguments);

            },

            processNextStep:function() {
                console.log(this.layout.activeItem.id);
                if(this.layout.activeItem.id === 'form-panel' ) {
                    this.layout.setActiveItem('properties');
                }

            }
        }
//end extending Config
);



