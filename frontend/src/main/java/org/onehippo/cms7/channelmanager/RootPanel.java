/*
 *  Copyright 2011-2014 Hippo B.V. (http://www.onehippo.com)
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
package org.onehippo.cms7.channelmanager;

import java.util.Map;

import org.apache.wicket.markup.head.IHeaderResponse;
import org.apache.wicket.model.Model;
import org.apache.wicket.request.cycle.RequestCycle;
import org.apache.wicket.request.handler.resource.ResourceReferenceRequestHandler;
import org.apache.wicket.request.resource.PackageResourceReference;
import org.hippoecm.frontend.PluginRequestTarget;
import org.hippoecm.frontend.plugin.IPluginContext;
import org.hippoecm.frontend.plugin.config.IPluginConfig;
import org.hippoecm.frontend.plugins.yui.layout.IWireframe;
import org.hippoecm.frontend.plugins.yui.layout.WireframeUtils;
import org.hippoecm.frontend.service.IRestProxyService;
import org.json.JSONException;
import org.json.JSONObject;
import org.onehippo.cms7.channelmanager.channels.BlueprintStore;
import org.onehippo.cms7.channelmanager.channels.ChannelOverview;
import org.onehippo.cms7.channelmanager.channels.ChannelStore;
import org.onehippo.cms7.channelmanager.channels.ChannelStoreFactory;
import org.onehippo.cms7.channelmanager.hstconfig.HstConfigEditor;
import org.onehippo.cms7.channelmanager.restproxy.RestProxyServicesManager;
import org.onehippo.cms7.channelmanager.templatecomposer.PageEditor;
import org.onehippo.cms7.channelmanager.widgets.ExtLinkPicker;
import org.wicketstuff.js.ext.ExtPanel;
import org.wicketstuff.js.ext.layout.BorderLayout;
import org.wicketstuff.js.ext.util.ExtClass;
import org.wicketstuff.js.ext.util.ExtProperty;
import org.wicketstuff.js.ext.util.JSONIdentifier;

import static org.onehippo.cms7.channelmanager.ChannelManagerConsts.HST_CONFIG_EDITOR_DISABLED;
import static org.onehippo.cms7.channelmanager.ChannelManagerConsts.HST_CONFIG_EDITOR_LOCK_INHERITED_NODES;

@ExtClass("Hippo.ChannelManager.RootPanel")
public class RootPanel extends ExtPanel {

    private static final long serialVersionUID = 1L;

    private static final PackageResourceReference BREADCRUMB_ARROW = new PackageResourceReference(RootPanel.class, "breadcrumb-arrow.png");

    public enum CardId {
        CHANNEL_MANAGER(0),
        TEMPLATE_COMPOSER(1),
        HST_CONFIG_EDITOR(2);

        private final int tabIndex;

        private CardId(int tabIndex) {
            this.tabIndex = tabIndex;
        }

        int getTabIndex() {
            return tabIndex;
        }

    }

    public static final String CONFIG_CHANNEL_LIST = "channel-list";
    public static final String CONFIG_TEMPLATE_COMPOSER = "templatecomposer";
    public static final String COMPOSER_REST_MOUNT_PATH_PROPERTY = "composerRestMountPath";
    public static final String DEFAULT_COMPOSER_REST_MOUNT_PATH = "/_rp";

    private BlueprintStore blueprintStore;
    private ChannelStore channelStore;
    private PageEditor pageEditor;
    private ExtStoreFuture<Object> channelStoreFuture;

    private boolean redraw = false;

    @ExtProperty
    private int activeItem = 0;

    @ExtProperty
    @SuppressWarnings("unused")
    private String composerRestMountPath;

    @Override
    public void buildInstantiationJs(final StringBuilder js, final String extClass, final JSONObject properties) {
        js.append("try { ");
        super.buildInstantiationJs(js, extClass, properties);
        js.append("} catch(exception) { console.log('Error initializing channel manager. '+exception); } ");
    }

    public RootPanel(final IPluginContext context, final IPluginConfig config, final String id) {
        super(id);

        final IPluginConfig channelListConfig = config.getPluginConfig(CONFIG_CHANNEL_LIST);

        // card 1: template composer
        final IPluginConfig pageEditorConfig = config.getPluginConfig(CONFIG_TEMPLATE_COMPOSER);
        if (pageEditorConfig == null) {
            composerRestMountPath = DEFAULT_COMPOSER_REST_MOUNT_PATH;
        } else {
            composerRestMountPath = pageEditorConfig.getString(COMPOSER_REST_MOUNT_PATH_PROPERTY, DEFAULT_COMPOSER_REST_MOUNT_PATH);
        }


        final Map<String, IRestProxyService> liveRestProxyServices = RestProxyServicesManager.getLiveRestProxyServices(context, config);

        this.blueprintStore = new BlueprintStore(liveRestProxyServices);
        this.channelStore = ChannelStoreFactory.createStore(context, channelListConfig, liveRestProxyServices, blueprintStore);
        this.channelStoreFuture = new ExtStoreFuture<>(channelStore);
        add(this.channelStore);
        add(this.channelStoreFuture);


        // card 0: channel manager
        final ExtPanel channelManagerCard = new ExtPanel();
        channelManagerCard.setBorder(false);
        channelManagerCard.setTitle(new Model<String>("Channel Manager"));
        channelManagerCard.setHeader(false);
        channelManagerCard.setLayout(new BorderLayout());

        final ChannelOverview channelOverview = new ChannelOverview(channelListConfig, composerRestMountPath, this.channelStoreFuture, !blueprintStore.isEmpty());
        channelOverview.setRegion(BorderLayout.Region.CENTER);
        channelManagerCard.add(channelOverview);

        final HstConfigEditor hstConfigEditor;
        if (config.getAsBoolean(HST_CONFIG_EDITOR_DISABLED, false)) {
            hstConfigEditor = null;
        } else {
            final boolean lockInheritedConfig = config.getAsBoolean(HST_CONFIG_EDITOR_LOCK_INHERITED_NODES, true);
            hstConfigEditor = new HstConfigEditor(context, lockInheritedConfig);
        }

        channelManagerCard.add(this.blueprintStore);

        add(channelManagerCard);

        // default contextpath just needs to be one of the available contextpaths for which a hst site webapp is available
        final String defaultContextPath = liveRestProxyServices.isEmpty() ? "" : liveRestProxyServices.keySet().iterator().next();
        pageEditor = new PageEditor(context, pageEditorConfig,
                defaultContextPath, composerRestMountPath, hstConfigEditor, this.channelStoreFuture);
        add(pageEditor);

        // card 2: HST config editor
        if (hstConfigEditor != null) {
            add(hstConfigEditor);
        }

        // card 3: folder picker
        add(new ExtLinkPicker(context));
    }

    public void redraw() {
        redraw = true;
    }

    public void render(final PluginRequestTarget target, final boolean showBreadcrumb) {
        pageEditor.render(target);
        channelStore.update();
        if (target != null) {
            if (redraw) {
                selectActiveItem(target);
                redraw = false;
            }
            updateBreadcrumb(showBreadcrumb, target);
        }
    }

    private void selectActiveItem(final PluginRequestTarget target) {
        final String script = String.format("Ext.getCmp('rootPanel').selectCard(%s);", activeItem);
        target.appendJavaScript(script);
    }

    private void updateBreadcrumb(final boolean showBreadcrumb, final PluginRequestTarget target) {
        if (showBreadcrumb) {
            target.appendJavaScript("Ext.getCmp('rootPanel').showBreadcrumb();");
        } else {
            target.appendJavaScript("Ext.getCmp('rootPanel').hideBreadcrumb();");
        }
    }

    @Override
    public void renderHead(final IHeaderResponse response) {
        final IWireframe parentWireframe = WireframeUtils.getParentWireframe(this);
        if (parentWireframe != null) {
            response.render(parentWireframe.getHeaderItem());
        }

        super.renderHead(response);

        response.render(ChannelManagerHeaderItem.get());
    }

    @Override
    protected void preRenderExtHead(StringBuilder js) {
        blueprintStore.onRenderExtHead(js);
        channelStore.onRenderExtHead(js);
        channelStoreFuture.onRenderExtHead(js);
        super.preRenderExtHead(js);
    }

    @Override
    protected void onRenderProperties(JSONObject properties) throws JSONException {
        super.onRenderProperties(properties);
        properties.put("blueprintStore", new JSONIdentifier(this.blueprintStore.getJsObjectId()));
        properties.put("channelStore", new JSONIdentifier(this.channelStore.getJsObjectId()));
        properties.put("channelStoreFuture", new JSONIdentifier(this.channelStoreFuture.getJsObjectId()));

        RequestCycle rc = RequestCycle.get();
        properties.put("breadcrumbIconUrl", rc.urlFor(new ResourceReferenceRequestHandler(
                BREADCRUMB_ARROW)));
    }

    public PageEditor getPageEditor() {
        return this.pageEditor;
    }

    public void setActiveCard(CardId rootPanelCard) {
        this.activeItem = rootPanelCard.getTabIndex();
        redraw();
    }

}
