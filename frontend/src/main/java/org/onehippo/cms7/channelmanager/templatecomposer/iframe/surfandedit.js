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
(function($) {

    var Main = Hippo.ChannelManager.TemplateComposer.IFrame.Main;

    var surfandedit = {

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
            var links = [];
            try {
                if (!!document.evaluate) {
                    // fast XPATH
                    var query = document.evaluate("//comment()", document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    for (var i = 0, length = query.snapshotLength; i < length; i++) {
                        var element = query.snapshotItem(i);
                        var hstMetaData = this.convertToHstMetaData(element);
                        if (hstMetaData !== null) {
                            links.push(hstMetaData[HST.ATTR.ID]);
                            this._createLink(element, hstMetaData)
                        }
                    }
                } else {
                    // fallback
                    var self = this;
                    var domWalker = function(node) {
                        if (!node || typeof node.nodeType === 'undefined') {
                            return;
                        }
                        if (node.nodeType === 8) {
                            var hstMetaData = self.convertToHstMetaData(node);
                            if (hstMetaData !== null) {
                                links.push(hstMetaData[HST.ATTR.ID]);
                                self._createLink(node, hstMetaData);
                            }
                            return;
                        }
                        for (var i=0, len=node.childNodes.length; i< len; i++) {
                            var childNode = node.childNodes[i];
                            domWalker(childNode);
                        }
                    };
                    domWalker(document.body);
                }
                sendMessage(links, 'documents');
            } catch(e) {
                sendMessage({msg: 'Error initializing manager.', exception: e}, "iframeexception");
            }
        },

        _createLink : function(commentElement, hstMetaData) {
            var die = Hippo.ChannelManager.TemplateComposer.IFrame.Main.die;

            var id = hstMetaData[HST.ATTR.ID];

            var newLink = document.createElement('A');
            if (commentElement.nextSibling) {
                commentElement.parentNode.insertBefore(newLink, commentElement.nextSibling);
            } else {
                commentElement.parentNode.appendChild(newLink);
            }

            $(newLink).append('<span>'+this.resources['edit-document']+'</span>');
            newLink.setAttribute(HST.ATTR.ID, id);
            newLink.setAttribute('href', '');
            newLink.setAttribute('class', HST.CLASS.EDITLINK);
            /**
            * use plain old javascript event listener to prevent other jQuery instances hijacking the event.
            */
            if (newLink.addEventListener) {
                newLink.addEventListener('click', function(event) {
                    sendMessage({uuid: id}, "edit-document");
                    event.stopPropagation();
                    event.preventDefault();
                    return false;
                }, false);
            } else if (newLink.attachEvent) {
                newLink.attachEvent('onclick', function(event) {
                    sendMessage({uuid: id}, "edit-document");
                    event.cancelBubble = true;
                    return false;
                });
            }

            commentElement.parentNode.removeChild(commentElement);
        },

        convertToHstMetaData : function(element) {
            var die = Hippo.ChannelManager.TemplateComposer.IFrame.Main.die;
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
                var commentJsonObject = JSON.parse(element.data);
                if (commentJsonObject[HST.ATTR.TYPE] === HST.CMSLINK
                        && typeof commentJsonObject[HST.ATTR.ID] !== 'undefined'
                        && typeof commentJsonObject[HST.ATTR.URL] !== 'undefined') {
                    return commentJsonObject;
                }
            } catch(exception) {
                die(this.resources['factory-error-parsing-hst-data'].format(element.data) +' '+ exception);
            }
            return null;
        }

    };

    Main.subscribe('initialize', surfandedit.init, surfandedit);

    onhostmessage(surfandedit.hideLinks, surfandedit, false, 'showoverlay');

    onhostmessage(surfandedit.showLinks, surfandedit, false, 'hideoverlay');

})(jQuery);