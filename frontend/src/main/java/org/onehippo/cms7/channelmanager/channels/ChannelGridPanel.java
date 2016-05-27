/**
 * Copyright 2011-2016 Hippo B.V. (http://www.onehippo.com)
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

package org.onehippo.cms7.channelmanager.channels;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.apache.wicket.Localizer;
import org.apache.wicket.WicketRuntimeException;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.markup.head.IHeaderResponse;
import org.apache.wicket.util.string.Strings;
import org.hippoecm.frontend.plugin.config.IPluginConfig;
import org.hippoecm.frontend.session.UserSession;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.onehippo.cms7.channelmanager.ChannelManagerHeaderItem;
import org.onehippo.cms7.channelmanager.ExtStoreFuture;
import org.onehippo.cms7.channelmanager.hstconfig.HstConfigEditor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wicketstuff.js.ext.ExtEventAjaxBehavior;
import org.wicketstuff.js.ext.ExtPanel;
import org.wicketstuff.js.ext.util.ExtClass;
import org.wicketstuff.js.ext.util.ExtEventListener;
import org.wicketstuff.js.ext.util.ExtProperty;
import org.wicketstuff.js.ext.util.JSONIdentifier;

/**
 * Ext Grid Panel for Channels Listing.
 */
@ExtClass("Hippo.ChannelManager.ChannelGridPanel")
public class ChannelGridPanel extends ExtPanel {

    public static final String CHANNEL_GRID_PANEL_JS = "ChannelGridPanel.js";
    private static final long serialVersionUID = 1L;

    private static final Logger log = LoggerFactory.getLogger(ChannelGridPanel.class);

    public static final String EDIT_HST_CONFIG_EVENT = "edit-hst-config";
    public static final String HST_CONFIG_EDITOR_COLUMN_ID = "hstConfigEditor";
    private final boolean canModifyChannels;

    private ChannelStore store;
    private List<String> visibleFields;
    
    @ExtProperty
    @SuppressWarnings("unused")
    private String cmsUser;
    
    @ExtProperty
    @SuppressWarnings("unused")
    private String composerRestMountPath;

    private static class EditHstConfigListener extends ExtEventListener {
        private final HstConfigEditor hstConfigEditor;

        public EditHstConfigListener(final HstConfigEditor hstConfigEditor) {
            this.hstConfigEditor = hstConfigEditor;
        }

        private static Object getValue(final Map<String, JSONArray> parameters, final String key) throws JSONException {
            JSONArray values = parameters.get(key);
            if (values == null || values.length() == 0) {
                return null;
            }
            return values.get(0);
        }

        @Override
        public void onEvent(final AjaxRequestTarget target, final Map<String, JSONArray> parameters) {
            if (this.hstConfigEditor == null) {
                return;
            }
            try {
                final String paramChannelId = (String) getValue(parameters, "channelId");
                final String paramHstMountPoint = (String) getValue(parameters, "hstMountPoint");
                target.prependJavaScript("Ext.getCmp('Hippo.ChannelManager.HstConfigEditor.Instance').initEditor();");
                this.hstConfigEditor.setMountPoint(target, paramChannelId, paramHstMountPoint);
            } catch (JSONException e) {
                throw new WicketRuntimeException("Invalid JSON parameters", e);
            }
        }
    }

    public ChannelGridPanel(IPluginConfig channelListConfig, String composerRestMountPath, ExtStoreFuture storeFuture, final HstConfigEditor hstConfigEditor) {
        this.store = (ChannelStore) storeFuture.getStore();

        this.cmsUser = UserSession.get().getJcrSession().getUserID();
        this.composerRestMountPath = composerRestMountPath;
        this.canModifyChannels = store.canModifyChannels();

        visibleFields = parseChannelFields(channelListConfig);
        visibleFields.removeAll(ChannelStore.INTERNAL_FIELDS);

        addEventListener(EDIT_HST_CONFIG_EVENT, new EditHstConfigListener(hstConfigEditor));
    }

    @Override
    protected ExtEventAjaxBehavior newExtEventBehavior(final String event) {
        if (EDIT_HST_CONFIG_EVENT.equals(event)) {
            return new ExtEventAjaxBehavior("channelId", "hstMountPoint");
        }
        return super.newExtEventBehavior(event);
    }

    static List<String> parseChannelFields(IPluginConfig channelListConfig) {
        List<String> columns = new ArrayList<String>();

        if (channelListConfig == null) {
            return ChannelStore.ALL_FIELD_NAMES;
        }

        String[] columnNames = channelListConfig.getStringArray(ChannelStoreFactory.CONFIG_COLUMNS);
        if (columnNames == null || columnNames.length == 0) {
            return ChannelStore.ALL_FIELD_NAMES;
        }
        columns.addAll(Arrays.asList(columnNames));
        if (!columns.contains(ChannelStore.ChannelField.name.name())) {
            columns.add(0, ChannelStore.ChannelField.name.name());
        }
        return columns;
    }

    @Override
    public void renderHead(final IHeaderResponse response) {
        super.renderHead(response);

        response.render(ChannelManagerHeaderItem.get());
    }

    @Override
    protected void onRenderProperties(JSONObject properties) throws JSONException {
        super.onRenderProperties(properties);
        properties.put("store", new JSONIdentifier(this.store.getJsObjectId()));
        properties.put("columns", getColumnsConfig());
    }

    private JSONArray getColumnsConfig() throws JSONException {
        JSONArray columnsConfig = new JSONArray();

        List<String> hiddenFields = new ArrayList<>(ChannelStore.ALL_FIELD_NAMES);
        hiddenFields.removeAll(ChannelStore.INTERNAL_FIELDS);

        if (!this.canModifyChannels) {
            visibleFields.remove(HST_CONFIG_EDITOR_COLUMN_ID);
            hiddenFields.remove(HST_CONFIG_EDITOR_COLUMN_ID);
        }

        for (String columnfield : visibleFields) {
            columnsConfig.put(createColumnFieldConfig(columnfield, false));
            hiddenFields.remove(columnfield);
        }

        for (String fieldName : hiddenFields) {
            columnsConfig.put(createColumnFieldConfig(fieldName, true));
        }

        return columnsConfig;
    }

    private JSONObject createColumnFieldConfig(String columnName, boolean isHidden) throws JSONException {
        final JSONObject fieldConfig = new JSONObject();
        fieldConfig.put("dataIndex", columnName);
        fieldConfig.put("id", columnName);
        fieldConfig.put("header", store.getLocalizedFieldName(columnName));
        fieldConfig.put("hidden", isHidden);

        try {
            final ChannelStore.ChannelField channelField = ChannelStore.ChannelField.valueOf(columnName);
            switch (channelField) {
                case name:
                    createNameFieldConfig(fieldConfig);
                    break;
                case url:
                    createUrlFieldConfig(fieldConfig);
                    break;
                case hstConfigEditor:
                    createHstConfigEditorFieldConfig(fieldConfig);
            }
        } catch (IllegalArgumentException e) {
            // custom field, ignore
        }
        return fieldConfig;
    }

    private void createHstConfigEditorFieldConfig(final JSONObject fieldConfig) throws JSONException {
        final String labelAction = getLocalizer().getString("action.hstconfigeditor", this);
        fieldConfig.put("xtype", "templatecolumn");

        final StringBuilder templateBuilder = new StringBuilder();
        templateBuilder.append("<tpl if=\"previewHstConfigExists=='true'\">");
        templateBuilder.append("<a href=\"#\" name=\"open-hstconfigeditor\">");
        templateBuilder.append(labelAction);
        templateBuilder.append("</a>");
        templateBuilder.append("</tpl>");

        fieldConfig.put("tpl",  templateBuilder.toString());
    }

    private void createUrlFieldConfig(final JSONObject fieldConfig) throws JSONException {
        // render the 'url' column as two links: one to the live site, and one to the preview site
        Localizer localizer = getLocalizer();
        CharSequence previewLabel = Strings.escapeMarkup(localizer.getString("action.preview", this));
        CharSequence liveTooltip = Strings.escapeMarkup(localizer.getString("tooltip.live", this));
        CharSequence previewTooltip = Strings.escapeMarkup(localizer.getString("tooltip.preview", this));
        fieldConfig.put("xtype", "templatecolumn");
        fieldConfig.put("tpl", "<a href=\"{url}\" name=\"show-live\" class=\"show-live\" target=\"_blank\" "
                + "title=\"" + liveTooltip + "\">{url}</a>"
                + "<a href=\"{contextPath}"
                + "{[values.cmsPreviewPrefix !== '' ? '/' : '']}{cmsPreviewPrefix}"
                + "{[values.mountPath === '' ? '/' : '']}{mountPath}\" "
                + "name=\"show-preview\" class=\"show-preview\" target=\"hippochannelmanagerpreview\" title=\""
                + previewTooltip + "\">" + previewLabel + "</a>");
    }

    private void createNameFieldConfig(final JSONObject fieldConfig) throws JSONException {
        // render the 'name' column as a link to the template composer
        String tooltipNamePrefix = getLocalizer().getString("tooltip.name.prefix", this);
        fieldConfig.put("xtype", "templatecolumn");
        fieldConfig.put("tpl", "<a href=\"#\" name=\"show-channel\" title=\"" + tooltipNamePrefix + " {name}\">{name}</a>");
    }
}
