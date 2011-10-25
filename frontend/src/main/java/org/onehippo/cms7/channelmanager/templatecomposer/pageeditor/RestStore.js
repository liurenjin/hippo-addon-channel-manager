/*
 *  Copyright 2011 Hippo.
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

Hippo.ChannelManager.TemplateComposer.RestStore = Ext.extend(Ext.data.Store, {

    constructor : function(config) {

        var reader = new Ext.data.JsonReader({
            successProperty: 'success',
            root: 'data',
            messageProperty: 'message',
            idProperty: 'id'
        }, config.prototypeRecord);

        var writer = new Ext.data.JsonWriter({
            encode: false   // <-- don't return encoded JSON -- causes Ext.Ajax#request to send data using jsonData config rather than HTTP params
        });

        var cfg = {
            restful: true,
            reader: reader,
            writer: writer
        };

        Ext.apply(this, cfg, config);
        Hippo.ChannelManager.TemplateComposer.RestStore.superclass.constructor.call(this, config);
    }
});
