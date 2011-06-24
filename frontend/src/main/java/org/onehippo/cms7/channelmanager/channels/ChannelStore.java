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

import java.security.PrivilegedAction;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.jcr.Credentials;
import javax.security.auth.Subject;

import org.hippoecm.frontend.session.UserSession;
import org.hippoecm.hst.configuration.channel.Channel;
import org.hippoecm.hst.configuration.channel.ChannelException;
import org.hippoecm.hst.configuration.channel.ChannelManager;
import org.hippoecm.hst.security.HstSubject;
import org.hippoecm.hst.site.HstServices;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wicketstuff.js.ext.data.ExtField;
import org.wicketstuff.js.ext.data.ExtGroupingStore;
import org.wicketstuff.js.ext.util.ExtClass;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Channel JSON Store.
 */
@ExtClass("Hippo.ChannelManager.ChannelStore")
public class ChannelStore extends ExtGroupingStore<Object> {

    /**
     * The first serialized version of this source. Version {@value}.
     */
    private static final long serialVersionUID = 1L;

    private static final Logger log = LoggerFactory.getLogger(ChannelStore.class);
    private long total;

    public ChannelStore(List<ExtField> fields) {
        super(fields);
    }

    @Override
    protected JSONObject getProperties() throws JSONException {
        //Need the sortinfo and xaction params since we are using GroupingStore instead of
        //JsonStore
        final JSONObject props = super.getProperties();
        Map<String, String> sortInfo = new HashMap<String, String>();
        sortInfo.put("field", "title");
        sortInfo.put("direction", "ASC");
        Map<String, String> baseParams = new HashMap<String, String>();
        baseParams.put("xaction", "read");
        props.put("baseParams", baseParams);
        return props;
    }

    @Override
    protected long getTotal() {
        return this.total;
    }

    @Override
    protected JSONArray getData() throws JSONException {
        JSONArray data = new JSONArray();
        Map<String, Channel> channels = getChannels();
        this.total = channels.size();
        for (Channel channel : channels.values()) {
            JSONObject object = new JSONObject();
            object.put("title", channel.getId());
            object.put("contentRoot", channel.getContentRoot());
            data.put(object);
        }
        return data;
    }

    @Override
    protected JSONObject createRecord(JSONObject record) throws JSONException {
        JSONObject result = new JSONObject();
        final ChannelManager channelManager = HstServices.getComponentManager().getComponent(ChannelManager.class.getName());
        final Channel c = new Channel("mobile", "mobile-french-channel");
        c.setTitle(record.getString("name"));
        c.setUrl(record.getString("domain"));

        // FIXME: move boilerplate to CMS engine
        UserSession session = (UserSession) org.apache.wicket.Session.get();
        Credentials credentials = session.getCredentials().getJcrCredentials();
        Subject subject = new Subject();
        subject.getPrivateCredentials().add(credentials);
        subject.setReadOnly();
        ChannelException ce = HstSubject.doAsPrivileged(subject, new PrivilegedAction<ChannelException>() {
            public ChannelException run() {
                try {
                    channelManager.save(c);
                    return null;
                } catch (ChannelException e) {
                    return e;
                } finally {
                    HstSubject.clearSubject();
                }
            }
        }, null);
        if (ce == null) {
            result.put("success", true);
        } else {
            log.error("Unable to save channel" + ce.getMessage(), ce);
            result.put("success", false);
        }

        return result;
    }

    private Map<String, Channel> getChannels() {
        ChannelManager channelManager = HstServices.getComponentManager().getComponent(ChannelManager.class.getName());
        if (channelManager != null) {
            try {
                return channelManager.getChannels();
            } catch (ChannelException e) {
                throw new RuntimeException("Unable to get the channels from Channel Manager", e);
            }
        } else {
            throw new RuntimeException("Unable to get the channels from Channel Manager");
        }
    }
}
