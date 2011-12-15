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
package org.onehippo.cms7.channelmanager.channels;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hippoecm.hst.configuration.channel.Blueprint;
import org.hippoecm.hst.configuration.channel.Channel;
import org.hippoecm.hst.configuration.channel.ChannelException;
import org.hippoecm.hst.configuration.channel.ChannelManager;
import org.hippoecm.hst.site.HstServices;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.wicketstuff.js.ext.data.ExtField;
import org.wicketstuff.js.ext.data.ExtJsonStore;

public class BlueprintStore extends ExtJsonStore<Object> {

    private static final String FIELD_NAME = "name";
    private static final String FIELD_DESCRIPTION = "description";
    private static final String FIELD_HAS_CONTENT_PROTOTYPE = "hasContentPrototype";
    private static final String FIELD_CONTENT_ROOT = "contentRoot";
    private static final long serialVersionUID = 1L;

    private Long total;

    public BlueprintStore() {
        super(Arrays.asList(new ExtField(FIELD_NAME), new ExtField(FIELD_DESCRIPTION), new ExtField(FIELD_HAS_CONTENT_PROTOTYPE), new ExtField(FIELD_CONTENT_ROOT)));
    }

    @Override
    protected long getTotal() {
        if (this.total == null) {
            this.total = Long.valueOf(getBlueprints().size());
        }
        return this.total;
    }

    public boolean isEmpty() {
        return getTotal() <= 0;
    }

    @Override
    protected JSONObject getProperties() throws JSONException {
        final JSONObject properties = super.getProperties();
        Map<String, String> baseParams = new HashMap<String, String>();
        baseParams.put("xaction", "read");
        properties.put("baseParams", baseParams);
        return properties;

    }

    @Override
    protected JSONArray getData() throws JSONException {
        JSONArray data = new JSONArray();
        List<Blueprint> blueprints = getBlueprints();
        this.total = Long.valueOf(blueprints.size());
        for (Blueprint blueprint : blueprints) {
            JSONObject object = new JSONObject();
            object.put("id", blueprint.getId());
            object.put(FIELD_NAME, blueprint.getName());
            object.put(FIELD_DESCRIPTION, blueprint.getDescription());

            boolean hasPrototype = blueprint.hasContentPrototype();
            object.put(FIELD_HAS_CONTENT_PROTOTYPE, hasPrototype);

            Channel channel = blueprint.createChannel();
            object.put(FIELD_CONTENT_ROOT, channel.getContentRoot());

            data.put(object);
        }
        return data;
    }

    private List<Blueprint> getBlueprints() {
        ChannelManager channelManager = HstServices.getComponentManager().getComponent(ChannelManager.class.getName());
        if (channelManager != null) {
            try {
                return channelManager.getBlueprints();
            } catch (ChannelException e) {
                throw new RuntimeException("Unable to get blueprints from ChannelManager.", e);
            }
        } else {
            throw new RuntimeException("Unable to get the Channel Manager instance.");
        }
    }
}
