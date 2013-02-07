/*
 *  Copyright 2010-2013 Hippo B.V. (http://www.onehippo.com)
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

    var hostToIFrame, iframeToHost, surfandedit;

    hostToIFrame = window.parent.Hippo.ChannelManager.TemplateComposer.IFramePanel.Instance.hostToIFrame;
    iframeToHost = window.parent.Hippo.ChannelManager.TemplateComposer.IFramePanel.Instance.iframeToHost;

    $(window).unload(function() {
        hostToIFrame = null;
        iframeToHost = null;
    });

    surfandedit = {

        init : function (data) {
            this.resources = data.resources;
            this.createSurfAndEditLinks();
        },

        showLinks: function() {
            $('.hst-cmseditlink').show();
        },

        hideLinks: function() {
            $('.hst-cmseditlink').hide();
        },

        createSurfAndEditLinks : function() {
            var self, links, query, i, length,  element, hstMetaData, domWalker;
            links = [];
            try {
                if (!!document.evaluate) {
                    // fast XPATH
                    query = document.evaluate("//comment()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    for (i = 0, length = query.snapshotLength; i < length; i++) {
                        element = query.snapshotItem(i);
                        hstMetaData = this.convertToHstMetaData(element);
                        if (hstMetaData !== null) {
                            links.push(hstMetaData[HST.ATTR.ID]);
                            this._createLink(element, hstMetaData);
                        }
                    }
                } else {
                    // fallback
                    self = this;
                    domWalker = function(node) {
                        if (!node || node.nodeType === undefined) {
                            return;
                        }
                        var i, hstMetaData, childNode, length;
                        if (node.nodeType === 8) {
                            hstMetaData = self.convertToHstMetaData(node);
                            if (hstMetaData !== null) {
                                links.push(hstMetaData[HST.ATTR.ID]);
                                self._createLink(node, hstMetaData);
                            }
                            return;
                        }
                        for (i = 0, length = node.childNodes.length; i < length; i++) {
                            childNode = node.childNodes[i];
                            domWalker(childNode);
                        }
                    };
                    domWalker(document.body);
                }
                iframeToHost.publish('documents', links);
            } catch(e) {
                iframeToHost.exception('Error initializing manager.', e);
            }
        },

        _createLink : function(commentElement, hstMetaData) {
            var id, newLink;

            id = hstMetaData[HST.ATTR.ID];

            newLink = document.createElement('A');
            if (commentElement.nextSibling) {
                commentElement.parentNode.insertBefore(newLink, commentElement.nextSibling);
            } else {
                commentElement.parentNode.appendChild(newLink);
            }

            $(newLink).append('<span class="' + HST.CLASS.EDITLINK + '-left"><span class="' + HST.CLASS.EDITLINK + '-right"><span class="' + HST.CLASS.EDITLINK + '-center">'+this.resources['edit-document']+'</span></span></span>');
            newLink.setAttribute(HST.ATTR.ID, id);
            newLink.setAttribute('href', '');
            newLink.setAttribute('class', HST.CLASS.EDITLINK);
            /**
            * use plain old javascript event listener to prevent other jQuery instances hijacking the event.
            */
            if (newLink.addEventListener) {
                newLink.addEventListener('click', function(event) {
                    iframeToHost.publish('edit-document', id);
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                }, false);
            } else if (newLink.attachEvent) {
                newLink.attachEvent('onclick', function(event) {
                    iframeToHost.publish('edit-document', id);
                    event.cancelBubble = true;
                    return false;
                });
            }

            commentElement.parentNode.removeChild(commentElement);
        },

        convertToHstMetaData : function(element) {
            var commentJsonObject;

            if (element.nodeType !== 8) {
                return null;
            }
            try {
                if (!element.data || element.data.length === 0
                        || element.data.indexOf(HST.ATTR.ID) === -1
                        || element.data.indexOf(HST.ATTR.TYPE) === -1
                        || element.data.indexOf(HST.ATTR.URL) === -1) {
                    return null;
                }
                commentJsonObject = JSON.parse(element.data);
                if (commentJsonObject[HST.ATTR.TYPE] === HST.CMSLINK
                        && commentJsonObject[HST.ATTR.ID] !== undefined
                        && commentJsonObject[HST.ATTR.URL] !== undefined) {
                    return commentJsonObject;
                }
            } catch (e) {
                iframeToHost.exception(this.resources['factory-error-parsing-hst-data'].format(element.data) + ' ' + e);
            }
            return null;
        }

    };

    hostToIFrame.subscribe('init', surfandedit.init, surfandedit);
    hostToIFrame.subscribe('hidelinks', surfandedit.hideLinks, surfandedit);
    hostToIFrame.subscribe('showlinks', surfandedit.showLinks, surfandedit);

}(jQuery));