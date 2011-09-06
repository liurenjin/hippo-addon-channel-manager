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
"use strict";

Ext.namespace('Hippo.ChannelManager');

Hippo.ChannelManager.ExtLinkPickerContainer = Ext.extend(Ext.form.TwinTriggerField,  {

    constructor : function(config) {
        if (config.eventHandlerId !== undefined) {
            Hippo.ChannelManager.ExtLinkPickerContainer.prototype.eventHandlerId = config.eventHandlerId;
        }
        this.pickerConfig = config.pickerConfig;
        this.defaultValue = config.defaultValue;
        this.setValue(this.defaultValue);

        Hippo.ChannelManager.ExtLinkPickerContainer.superclass.constructor.call(this, config);
    },

    initComponent : function() {
        Hippo.ChannelManager.ExtLinkPickerContainer.superclass.initComponent.call(this);

        this.addEvents('picked');

        this.on('picked', this.picked);
        this.on('afterrender', this.updateClearButton);
    },

    editable: false,
    trigger1Class: 'x-form-clear-trigger',
    trigger2Class: 'x-form-search-trigger',

    onTriggerClick: function() {
        this.openPicker();
    },

    onTrigger1Click: function() {
        this.picked(this.defaultValue);
    },

    onTrigger2Click: function() {
        this.openPicker();
    },

    setDefaultValue: function(value) {
        var oldDefaultValue = this.defaultValue;
        this.defaultValue = value;
        if (this.getValue() === oldDefaultValue) {
            this.setValue(this.defaultValue);
        }
    },

    openPicker: function() {
        if (this.eventHandlerId === undefined) {
            console.error("Cannot open picker dialog: no picker event handler registered");
            return;
        }
        var eventHandler = Ext.getCmp(this.eventHandlerId);
        if (eventHandler !== undefined) {
            eventHandler.fireEvent('pick', this.getId(), this.getValue(), Ext.util.JSON.encode(this.pickerConfig));
        } else {
            console.error("No picker event handler registered with id '" + this.eventHandlerId);
        }
    },

    picked: function(value) {
        this.setValue(value);
        this.updateClearButton();
    },

    updateClearButton: function() {
        var clearTrigger = this.getTrigger(0);
        if (this.getValue() === this.defaultValue) {
            clearTrigger.hide();
        } else {
            clearTrigger.show();
        }
    }

});

Ext.reg('linkpicker', Hippo.ChannelManager.ExtLinkPickerContainer);
