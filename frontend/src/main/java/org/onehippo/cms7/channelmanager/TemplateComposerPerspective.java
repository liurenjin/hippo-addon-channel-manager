/**
 * Copyright 2011 Hippo
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


import org.apache.wicket.Page;
import org.apache.wicket.ResourceReference;
import org.apache.wicket.ajax.AjaxRequestTarget;
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
import org.onehippo.cms7.channelmanager.templatecomposer.PageEditor;
import org.onehippo.cms7.channelmanager.templatecomposer.TemplateComposerResourceBehavior;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wicketstuff.js.ext.util.ExtResourcesBehaviour;

public class TemplateComposerPerspective extends Perspective {
    private static final Logger log = LoggerFactory.getLogger(ChannelManagerPerspective.class);

    public static final String TC_PERSPECTIVE_SERVICE = "TC_PERSPECTIVE_SERVICE";

    private PageEditor pageEditor;

    public TemplateComposerPerspective(IPluginContext context, IPluginConfig config) {
        super(context, config);
        context.registerService(this, TC_PERSPECTIVE_SERVICE);

        setOutputMarkupId(true);
        IPluginConfig pageEditorConfig = config.getPluginConfig("templatecomposer");

        pageEditor = new PageEditor("page-editor", pageEditorConfig);
        pageEditor.setOutputMarkupId(true);
        add(pageEditor);

        IPluginConfig wfConfig = config.getPluginConfig("layout.wireframe");
        if (wfConfig != null) {
            WireframeSettings wfSettings = new WireframeSettings(wfConfig);
            add(new WireframeBehavior(wfSettings));
        }
    }

    public void focus(final AjaxRequestTarget target, final String renderHost, final String renderHostSubMountPath) {
        pageEditor.setRenderHost(renderHost);
        pageEditor.setRenderHostSubMountPath(renderHostSubMountPath);
        target.addComponent(pageEditor);
        focus(null);
    }

    @Override
    protected void onStart() {
        super.onStart();

        IRenderService renderService = this;
        while (renderService.getParentService() != null) {
            renderService = renderService.getParentService();
        }
        Page page = renderService.getComponent().getPage();
        page.add(new ExtResourcesBehaviour());
        page.add(new TemplateComposerResourceBehavior());
    }


    @Override
    public IModel<String> getTitle() {
        return new StringResourceModel("perspective-title", this, new Model<String>("Template Composer"));
    }


    @Override
    public ResourceReference getIcon(IconSize type) {
        return new ResourceReference(ChannelManagerPerspective.class, "channel-manager-" + type.getSize() + ".png");

    }
}
