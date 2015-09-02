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
(function () {
  "use strict";

  Ext.namespace('Hippo.ChannelManager.TemplateComposer');

  Hippo.ChannelManager.TemplateComposer.PropertiesEditor = Ext.extend(Ext.Panel, {

    componentId: null,
    variant: null,
    propertiesForm: null,
    isReadOnly: false,

    constructor: function (config) {
      Hippo.ChannelManager.TemplateComposer.PropertiesEditor.superclass.constructor.call(this, config);
      this.componentId = config.componentId;
      this.variant = config.variant;
      this.propertiesForm = config.propertiesForm;
      this.isReadOnly = config.isReadOnly;
      this.componentMessageBus = config.componentMessageBus;

      this.addEvents('visibleHeightChanged');
    },

    load: function () {
      return this.propertiesForm.load();
    },

    /**
     * The visible height is the height that should be visible to the user.
     * Subclasses should override this method to calculate their visible height and
     * fire a 'visibleHeightChanged' event whenever their visible height has changed.
     */
    syncVisibleHeight: function () {
      // empty base method
    },

    /**
     * Marks this editor as 'dirty' or not.
     * @param isDirty whether to mark this editor as dirty.
     */
    markDirty: function (isDirty) {
      this.propertiesForm.markDirty(isDirty === undefined ? true : isDirty);
    }

  });

}());