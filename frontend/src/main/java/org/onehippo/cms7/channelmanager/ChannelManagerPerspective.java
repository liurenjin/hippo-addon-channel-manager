/**
 * Copyright 2010 Hippo
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

package org.onehippo.cms7.channelmanager;

import org.apache.wicket.Application;
import org.apache.wicket.Page;
import org.apache.wicket.ResourceReference;
import org.apache.wicket.markup.html.JavascriptPackageResource;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;
import org.apache.wicket.model.StringResourceModel;
import org.hippoecm.frontend.plugin.IPluginContext;
import org.hippoecm.frontend.plugin.config.IPluginConfig;
import org.hippoecm.frontend.plugins.standards.perspective.Perspective;
import org.hippoecm.frontend.plugins.yui.layout.WireframeBehavior;
import org.hippoecm.frontend.plugins.yui.layout.WireframeSettings;
import org.hippoecm.frontend.service.IRenderService;
import org.hippoecm.frontend.service.IconSize;
import org.onehippo.cms7.channelmanager.channels.ChannelGridPanel;
import org.onehippo.cms7.channelmanager.channels.ChannelPropertiesPanel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * ChannelManagerPerspective
 *
 * @author Vijay Kiran
 */
public class ChannelManagerPerspective extends Perspective {
    private static final Logger log = LoggerFactory.getLogger(ChannelManagerPerspective.class);

    public ChannelManagerPerspective(final IPluginContext context, final IPluginConfig config) {
        super(context, config);

        IPluginConfig wfConfig = config.getPluginConfig("layout.wireframe");
        if (wfConfig != null) {
            WireframeSettings wfSettings = new WireframeSettings(wfConfig);
            add(new WireframeBehavior(wfSettings));
        }

        RootPanel rootPanel = new RootPanel("channel-root");
        add(rootPanel);
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (Application.get().getDebugSettings().isAjaxDebugModeEnabled()) {
            IRenderService renderService = this;
            while (renderService.getParentService() != null) {
                renderService = renderService.getParentService();
            }
            Page page = renderService.getComponent().getPage();
            page.add(JavascriptPackageResource.getHeaderContribution(RootPanel.class, "Hippo.ChannelManager.RootPanel.js"));
            page.add(JavascriptPackageResource.getHeaderContribution(RootPanel.class, "Hippo.ChannelManager.BlueprintListPanel.js"));
            page.add(JavascriptPackageResource.getHeaderContribution(RootPanel.class, "Hippo.ChannelManager.ChannelFormPanel.js"));
            page.add(JavascriptPackageResource.getHeaderContribution(ChannelPropertiesPanel.class, "Hippo.ChannelManager.ChannelPropertiesPanel.js"));
            page.add(JavascriptPackageResource.getHeaderContribution(ChannelGridPanel.class, "Hippo.ChannelManager.ChannelGridPanel.js"));
        }
    }

    @Override
    public IModel<String> getTitle() {
        return new StringResourceModel("perspective-title", this, new Model<String>("Channel Manager"));
    }


    @Override
    public ResourceReference getIcon(IconSize type) {
        return new ResourceReference(ChannelManagerPerspective.class, "channel-manager-" + type.getSize() + ".png");

    }
}
