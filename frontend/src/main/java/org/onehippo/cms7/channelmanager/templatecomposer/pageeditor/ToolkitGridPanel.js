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

Ext.namespace('Hippo.ChannelManager.TemplateComposer');

Hippo.ChannelManager.TemplateComposer.ToolkitGridPanel = Ext.extend(Ext.grid.GridPanel, {

    getView : function() {
        if (!this.view) {
            this.view = new Hippo.ChannelManager.TemplateComposer.IconGridView({grid: this});
        }

        return this.view;
    }

});
Ext.reg('h_toolkit_grid', Hippo.ChannelManager.TemplateComposer.ToolkitGridPanel);