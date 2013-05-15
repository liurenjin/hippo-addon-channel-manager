/*
 *  Copyright 2013 Hippo B.V. (http://www.onehippo.com)
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
package org.onehippo.cms7.channelmanager.templatecomposer.deviceskins;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.wicket.RequestCycle;
import org.apache.wicket.Resource;
import org.apache.wicket.ResourceReference;
import org.apache.wicket.markup.html.CSSPackageResource;
import org.apache.wicket.markup.html.IHeaderContributor;
import org.apache.wicket.markup.html.JavascriptPackageResource;
import org.apache.wicket.util.resource.IResourceStream;
import org.apache.wicket.util.resource.StringResourceStream;
import org.hippoecm.frontend.plugin.IPluginContext;
import org.hippoecm.frontend.plugin.config.IPluginConfig;
import org.json.JSONException;
import org.json.JSONObject;
import org.onehippo.cms7.channelmanager.templatecomposer.ToolbarPlugin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wicketstuff.js.ext.data.ExtArrayStore;
import org.wicketstuff.js.ext.data.ExtField;
import org.wicketstuff.js.ext.util.ExtClass;
import org.wicketstuff.js.ext.util.JSONIdentifier;

/**
 * @version "$Id$"
 */
@ExtClass("Hippo.ChannelManager.DeviceManager")
public class DeviceManager extends ToolbarPlugin implements IHeaderContributor {

    private static Logger log = LoggerFactory.getLogger(DeviceManager.class);

    protected static final String DEVICE_MANAGER_JS = "DeviceManager.js";
    protected static final String SERVICE_ID = "deviceskins.service.id";

    private final ExtArrayStore store;
    private final DeviceService service;

    public DeviceManager(IPluginContext context, IPluginConfig config) {
        super(context, config);

        if (config.containsKey(SERVICE_ID)) {
            service = context.getService(config.getString(SERVICE_ID), DeviceService.class);
        } else {
            // loading default service
            final ClassPathDeviceService defaultDeviceService = new ClassPathDeviceService(context, config);
            service = defaultDeviceService;
        }

        addHeadContribution();

        final List<DeviceSkin> deviceSkins = service.getDeviceSkins();
        List<DeviceSkinDetails> detailsList = new ArrayList<DeviceSkinDetails>();
        for (DeviceSkin skin : deviceSkins) {
            detailsList.add(new DeviceSkinDetails(skin));
        }
        this.store = new ExtArrayStore<DeviceSkinDetails>(Arrays.asList(new ExtField("name"), new ExtField("id"),
                new ExtField("imageUrl")));
        this.store.loadData(detailsList);
    }

    /**
     * Adding js file and generating dynamic css.
     */
    public void addHeadContribution() {
        add(JavascriptPackageResource.getHeaderContribution(DeviceManager.class, DEVICE_MANAGER_JS));

        ResourceReference resourceReference = new ResourceReference(DeviceManager.class, "dynamic.css") {

            @Override
            protected Resource newResource() {
                return new Resource() {
                    private static final long serialVersionUID = 1L;

                    @Override
                    public IResourceStream getResourceStream() {
                        StringBuilder buf = new StringBuilder();
                        for (DeviceSkin skin : service.getDeviceSkins()) {
                            buf.append(skin.getCss());
                        }
                        return new StringResourceStream(buf.toString(), "text/css");
                    }
                };
            }
        };
        add(CSSPackageResource.getHeaderContribution(resourceReference));
    }


    @Override
    protected void preRenderExtHead(StringBuilder js) {
        store.onRenderExtHead(js);
        super.preRenderExtHead(js);
    }

    @Override
    protected void onRenderProperties(JSONObject properties) throws JSONException {
        super.onRenderProperties(properties);
        properties.put("deviceStore", new JSONIdentifier(this.store.getJsObjectId()));

    }

    static class DeviceSkinDetails implements Serializable {
        private final String id;
        private final String name;
        private final String imageUrl;

        public DeviceSkinDetails(final DeviceSkin skin) {
            this.id = skin.getId();
            this.name = skin.getName();

            RequestCycle rc = RequestCycle.get();
            this.imageUrl = rc.urlFor(skin.getImage()).toString();
        }

        public String getId() {
            return id;
        }

        public String getName() {
            return name;
        }

        public String getImageUrl() {
            return imageUrl;
        }
    }

}
