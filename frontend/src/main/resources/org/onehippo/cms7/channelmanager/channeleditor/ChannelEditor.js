/*
 *  Copyright 2015-2016 Hippo B.V. (http://www.onehippo.com)
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

(function($) {
  "use strict";

  Ext.namespace('Hippo.ChannelManager.ChannelEditor');

  Hippo.ChannelManager.ChannelEditor.ChannelEditor = Ext.extend(Hippo.IFramePanel, {

    constructor: function(config) {
      this.apiUrlPrefix = config.apiUrlPrefix;
      this.title = null;
      this.antiCache = new Date().getTime();

      Hippo.ChannelManager.ChannelEditor.Resources = config.resources;

      Ext.apply(config, {
        cls: 'qa-channel-editor',
        iframeConfig: Ext.apply({}, config, {
          antiCache: this.antiCache,
          cmsLocation: Ext.getDoc().dom.location
        })
      });
      Hippo.ChannelManager.ChannelEditor.ChannelEditor.superclass.constructor.call(this, config);

      // In case of reloading the iframe, the ng-app will ask us to provide the channel info (again)
      this.iframeToHost.subscribe('reload-channel', function() {
        if (this.selectedChannel) {
          this.loadChannel(this.selectedChannel.id);
        }
      }.bind(this));

      this.iframeToHost.subscribe('channel-changed-in-angular', this._reloadChannels, this);
      this.iframeToHost.subscribe('switch-channel', this._setChannel, this);
      this.iframeToHost.subscribe('show-component-properties', this._showComponentProperties, this);
      this.iframeToHost.subscribe('show-picker', this._showPicker, this);
      this.iframeToHost.subscribe('component-removed', this._onComponentRemoved, this);
      this.iframeToHost.subscribe('reset-component-properties', this._resetComponentPropertiesWindow, this);
      this.iframeToHost.subscribe('open-content', this._openDocumentEditor, this);
      this.iframeToHost.subscribe('show-mask', this._maskSurroundings, this);
      this.iframeToHost.subscribe('remove-mask', this._unmaskSurroundings, this);
      this.iframeToHost.subscribe('edit-alter-ego', this._showAlterEgoEditor, this);

      this.addEvents('open-document-editor');
    },

    loadChannel: function(channelId, initialPath) {
      this.hostToIFrame.publish('clear-channel');
      this._setChannel(channelId).when(function(channelRecord) {
        this.hostToIFrame.publish('load-channel', channelRecord.json, initialPath);
      }.bind(this));
    },

    _reloadChannels: function() {
      return new Hippo.Future(function(success) {
        this.channelStoreFuture.when(function (config) {
          config.store.on('load', success, this, { single: true });
          config.store.reload();
        });
      }.bind(this));
    },

    reloadPage: function() {
      if (this.selectedChannel) {
        this.hostToIFrame.publish('reload-page');
      }
    },

    _syncChannel: function() {
      this._reloadChannels().when(function (channelStore) {
        var id = this.selectedChannel.id;
        this.selectedChannel = channelStore.getById(id);
        if (!this.selectedChannel) {
          // we may just have created the preview config of this channel
          this.selectedChannel = channelStore.getById(id + '-preview');
        }
        this.hostToIFrame.publish('channel-changed-in-extjs');
      }.bind(this));
    },

    _renderComponent: function(componentId, propertiesMap) {
      this.hostToIFrame.publish('render-component', componentId, propertiesMap);
    },

    _onComponentChanged: function (componentId) {
      this._renderComponent(componentId, {});
      this._syncChannel();
    },

    _onComponentLocked: function(data) {
      this._resetComponentPropertiesWindow();
      this.hostToIFrame.publish('reload-channel', data);
    },

    _resetComponentPropertiesWindow: function() {
      if (this.componentPropertiesWindow) {
        this.componentPropertiesWindow.destroy();
      }
      this.componentPropertiesWindow = this._createComponentPropertiesWindow();
    },

    _openDocumentEditor: function(uuid) {
      this.fireEvent('open-document-editor', uuid);
    },

    _setChannel: function(channelId) {
      return new Hippo.Future(function (success, failure) {
        this._reloadChannels().when(function (channelStore) {
          var channelRecord = this._getChannelRecord(channelStore, channelId);
          if (channelRecord) {
            this._initialize(channelRecord.json);
            success(channelRecord);
          } else {
            failure();
          }
        }.bind(this));
      }.bind(this));
    },

    _getChannelRecord: function(channelStore, channelId) {
      var channelRecord = channelStore.getById(channelId);
      if (!channelRecord && channelId.endsWith('-preview')) {
        // try to use the live channel instead.
        channelRecord = channelStore.getById(channelId.replace(/-preview$/, ''));
      }
      return channelRecord;
    },

    _initialize: function(channel) {
      this.selectedChannel = channel;

      this._resetComponentPropertiesWindow();

      // update breadcrumb
      this.setTitle(channel.name);
    },

    _createComponentPropertiesWindow: function() {
      return new Hippo.ChannelManager.ChannelEditor.ComponentPropertiesWindow({
        id: 'componentPropertiesWindow',
        title: Hippo.ChannelManager.ChannelEditor.Resources['properties-window-default-title'],
        x: 10,
        y: 120,
        width: 525,
        height: 350,
        closable: true,
        closeAction: 'hide',
        collapsible: false,
        constrainHeader: true,
        renderTo: this.el,
        constrain: true,
        hidden: true,
        composerRestMountUrl: this.selectedChannel.contextPath + this.apiUrlPrefix,
        locale: this.locale,
        variantsUuid: this.variantsUuid,
        mountId: this.selectedChannel.mountId,
        listeners: {
          variantDeleted: this._syncChannel,
          deleteComponent: this._deleteComponent,
          propertiesChanged: this._renderComponent,
          componentChanged: this._onComponentChanged,
          componentLocked: this._onComponentLocked,
          hide: function() {
            this.hostToIFrame.publish('hide-component-properties');
          },
          scope: this
        }
      });
    },

    _deleteComponent: function (componentId) {
      this.componentPropertiesWindow.hide();
      this.hostToIFrame.publish('delete-component', componentId);
    },

    _showComponentProperties: function(selected) {
      this.componentPropertiesWindow.showComponent(
        selected.component,
        selected.container,
        selected.page
      );
    },

    _showPicker: function(field, value, pickerConfig) {
      this.pickedField = field;
      Hippo.ChannelManager.ExtLinkPickerFactory.Instance.openPicker(value, pickerConfig, this._onPicked.bind(this));
    },

    _onPicked: function(path, displayValue) {
      this.hostToIFrame.publish('picked', this.pickedField, path, displayValue);
    },

    _onComponentRemoved: function() {
      this.componentPropertiesWindow.onComponentRemoved();
    },

    _maskSurroundings: function() {
      $(document.body).append(
        '<div class="channel-editor-mask channel-editor-mask-left"></div>' +
        '<div class="channel-editor-mask channel-editor-mask-bottom"></div>'
      );
    },

    _unmaskSurroundings: function() {
      $(document.body).children('.channel-editor-mask')
        .addClass('channel-editor-mask-removing')
        .delay(400)
        .queue(function() {
          $(this).remove();
        });
    },

    _showAlterEgoEditor: function(mainToolbarHeight) {
      var alterEgoWindowConfig = Hippo.ExtWidgets.getConfig('Hippo.Targeting.AlterEgoWindow'),
        alterEgoWindow = Ext.create(alterEgoWindowConfig);

      // center the alter ego window below the main Angular Material toolbar
      alterEgoWindow.on('afterrender', function () {
        var centeredXY = alterEgoWindow.getEl().getAlignToXY(alterEgoWindow.container, 'c-c');
        alterEgoWindow.setPagePosition(centeredXY[0], mainToolbarHeight);
      }, this);

      alterEgoWindow.on('alterEgoChanged', function () {
        this.hostToIFrame.publish('alter-ego-changed');
      }, this);

      alterEgoWindow.show();
    },

    initComponent: function() {
      Hippo.ChannelManager.ChannelEditor.ChannelEditor.superclass.initComponent.call(this);

      this.channelStoreFuture.when(this._startApp.bind(this));
    },

    _startApp: function() {
      var url = './angular/hippo-cm/index.html';
      url = Ext.urlAppend(url, 'parentExtIFramePanelId=' + this.getId());
      url = Ext.urlAppend(url, 'antiCache=' + this.antiCache);
      this.setLocation(url);
    }
  });

}(jQuery));
