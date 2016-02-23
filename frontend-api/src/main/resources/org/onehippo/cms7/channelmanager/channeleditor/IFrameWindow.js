/*
 * Copyright 2016 Hippo B.V. (http://www.onehippo.com)
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

  Ext.namespace('Hippo.ChannelManager.ChannelEditor');

  /**
   * Window that shows a single IFramePanel. The ID of the enclosed IFramePanel is passed to the iframe
   * as a query parameter 'parentExtIFramePanelId'.
   *
   * The 'close' icon of the window triggers a handshake with the iframe. The host sends a 'close-request'
   * message to the iframe, to which the iframe should respond with either a 'close-reply-ok' or
   * 'close-reply-not-ok' message. The former will close the window, the latter will cancel the close.
   *
   * @type {*}
   */
  Hippo.ChannelManager.ChannelEditor.IFrameWindow = Ext.extend(Ext.Window, {

    performCloseHandshake: true,

    constructor: function (config) {
      var isClosing = false,
        url = config.iframeUrl;

      this.iframePanelId = Ext.id();

      url = Ext.urlAppend(url, 'parentExtIFramePanelId=' + this.iframePanelId);
      url = Ext.urlAppend(url, 'antiCache=' + config.antiCache);

      Ext.apply(config, {
        layout: 'fit',
        items: [
          {
            xtype: 'Hippo.IFramePanel',
            id: this.iframePanelId,
            url: url,
            iframeConfig: config.iframeConfig
          }
        ],
        listeners: {
          'afterrender': function (self) {
            var messageBus = self.getIFramePanel().iframeToHost;

            messageBus.subscribe('close-reply', function () {
              // make sure AngularJS in the iframe is properly destroyed by changing the
              // location to about:blank before removing the iframe element from the DOM
              var iframePanel = Ext.getCmp(self.iframePanelId);
              iframePanel.on('locationchanged', function() {
                isClosing = true;
                self.close();
                isClosing = false;
              }, this, { single: true });
              iframePanel.setLocation('about:blank');
            });

            messageBus.subscribe('browseTo', function (pathInfo, mountId) {
              if (Ext.isDefined(mountId)) {
                Hippo.ChannelManager.ChannelEditor.Instance.fireEvent('mountChanged', {
                  mountId: mountId,
                  renderPathInfo: pathInfo
                });
              } else {
                // TODO: open page
                console.log('TODO: open page ' + pathInfo);
                // old code: Hippo.ChannelManager.ChannelEditor.Instance.browseTo({renderPathInfo: pathInfo});
              }
              self.close();
            });
          },
          'beforeclose': function (self) {
            if (self.performCloseHandshake && !isClosing) {
              self.getIFramePanel().hostToIFrame.publish('close-request');
              return false;
            }
          }
        }
      });

      Hippo.ChannelManager.ChannelEditor.IFrameWindow.superclass.constructor.call(this, config);
    },

    getIFramePanel: function () {
      return Ext.getCmp(this.iframePanelId);
    }

  });

  Ext.reg('Hippo.ChannelManager.ChannelEditor.IFrameWindow', Hippo.ChannelManager.ChannelEditor.IFrameWindow);

}());
