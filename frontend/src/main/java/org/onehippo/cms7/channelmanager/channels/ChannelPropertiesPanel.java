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

import java.security.PrivilegedActionException;
import java.security.PrivilegedExceptionAction;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import javax.jcr.Credentials;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.security.auth.Subject;

import org.apache.wicket.Session;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.markup.html.WebMarkupContainer;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.list.ListItem;
import org.apache.wicket.markup.html.list.ListView;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.LoadableDetachableModel;
import org.apache.wicket.model.Model;
import org.hippoecm.frontend.plugin.IPluginContext;
import org.hippoecm.frontend.session.UserSession;
import org.hippoecm.frontend.widgets.BooleanFieldWidget;
import org.hippoecm.frontend.widgets.TextFieldWidget;
import org.hippoecm.hst.configuration.channel.Blueprint;
import org.hippoecm.hst.configuration.channel.Channel;
import org.hippoecm.hst.configuration.channel.ChannelException;
import org.hippoecm.hst.configuration.channel.ChannelManager;
import org.hippoecm.hst.configuration.channel.HstPropertyDefinition;
import org.hippoecm.hst.configuration.components.HstValueType;
import org.hippoecm.hst.configuration.components.ImageSetLink;
import org.hippoecm.hst.security.HstSubject;
import org.hippoecm.hst.site.HstServices;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.onehippo.cms7.channelmanager.ChannelManagerPerspective;
import org.onehippo.cms7.channelmanager.TemplateComposerPerspective;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wicketstuff.js.ext.ExtBoxComponent;
import org.wicketstuff.js.ext.ExtButton;
import org.wicketstuff.js.ext.ExtEventAjaxBehavior;
import org.wicketstuff.js.ext.form.ExtFormPanel;
import org.wicketstuff.js.ext.util.ExtClass;
import org.wicketstuff.js.ext.util.ExtEventListener;

@ExtClass("Hippo.ChannelManager.ChannelPropertiesPanel")
public class ChannelPropertiesPanel extends ExtFormPanel {

    static final Logger log = LoggerFactory.getLogger(ChannelPropertiesPanel.class);

    public static final String CHANNEL_PROPERTIES_PANEL_JS = "Hippo.ChannelManager.ChannelPropertiesPanel.js";

    private Channel channel;

    public ChannelPropertiesPanel(final IPluginContext context) {
        super();

        final WebMarkupContainer container = new WebMarkupContainer("container");
        container.add(new ListView<String>("properties", new LoadableDetachableModel<List<String>>() {

            @Override
            protected List<String> load() {
                if (channel == null) {
                    return Collections.emptyList();
                } else {
                    return new ArrayList<String>(channel.getProperties().keySet());
                }
            }

        }) {

            @Override
            protected void populateItem(final ListItem<String> item) {
                final String key = item.getModelObject();
                HstPropertyDefinition propDef = getPropertyDefinition(key);

                if (propDef == null) {
                    log.warn("Ignoring property '{}': no definition found");
                    return;
                }

                item.add(new Label("key", key));

                HstValueType propType = propDef.getValueType();
                ImageSetLink imageSetLink = propDef.getAnnotation(ImageSetLink.class);

                if (imageSetLink != null && propType.equals(HstValueType.STRING)) {
                    IModel<String> model = new UuidFromPathModel(channel.getProperties(), key);
                    item.add(new ImageSetFieldWidget(context, "value", imageSetLink, model));
                } else if (propType.equals(HstValueType.BOOLEAN)) {
                    item.add(new BooleanFieldWidget("value", new BooleanModel(channel.getProperties(), key)));
                } else {
                    item.add(new TextFieldWidget("value", new StringModel(channel.getProperties(), key)));
                }
            }
        });
        container.setOutputMarkupId(true);
        ExtBoxComponent box = new ExtBoxComponent();
        box.add(container);
        add(box);

        add(new ExtButton(new Model<String>("Channel")) {
            @Override
            protected void onClick(final AjaxRequestTarget target) {
                super.onClick(target);
                ChannelManagerPerspective channelManagerPerspective = findParent(ChannelManagerPerspective.class);
                IPluginContext context = channelManagerPerspective.getPluginContext();
                TemplateComposerPerspective templateComposerPerspective = context.getService(TemplateComposerPerspective.TC_PERSPECTIVE_SERVICE, TemplateComposerPerspective.class);
                templateComposerPerspective.focus(target, channel.getHostname(), channel.getSubMountPath());
            }
        });

        addEventListener("selectchannel", new ExtEventListener() {
            @Override
            public void onEvent(final AjaxRequestTarget target, final Map<String, JSONArray> parameters) {
                if (parameters.containsKey("channelId")) {
                    JSONArray channels = parameters.get("channelId");
                    if (channels.length() > 0) {
                        try {
                            channel = getChannel((String) channels.get(0));
                        } catch (JSONException e) {
                            log.error("Invalid JSON", e);
                        }
                    }
                }
                target.addComponent(container);
            }
        });
        addEventListener("save", new ExtEventListener() {
            @Override
            public void onEvent(final AjaxRequestTarget target, final Map<String, JSONArray> parameters) {
                save();
            }
        });
    }

    private void save() {
        if (channel == null) {
            return;
        }
        // FIXME: move boilerplate to CMS engine
        UserSession session = (UserSession) org.apache.wicket.Session.get();
        Credentials credentials = session.getCredentials().getJcrCredentials();
        Subject subject = new Subject();
        subject.getPrivateCredentials().add(credentials);
        subject.setReadOnly();

        try {
            HstSubject.doAsPrivileged(subject, new PrivilegedExceptionAction<Void>() {
                public Void run() throws ChannelException {
                    getChannelManager().save(channel);
                    return null;
                }
            }, null);
        } catch (PrivilegedActionException e) {
            log.error("Unable to save channel" + e.getException().getMessage(), e.getException());
        } finally {
            HstSubject.clearSubject();
        }
    }

    @Override
    protected ExtEventAjaxBehavior newExtEventBehavior(final String event) {
        if ("selectchannel".equals(event)) {
            return new ExtEventAjaxBehavior() {
                @Override
                public String[] getParameters() {
                    return new String[]{"channelId"};
                }
            };
        }
        return super.newExtEventBehavior(event);
    }

    private Blueprint getBlueprint() {
        if (channel == null) {
            return null;
        }
        try {
            return getChannelManager().getBlueprint(channel.getBlueprintId());
        } catch (ChannelException e) {
            throw new RuntimeException("Unable to get the channels from Channel Manager", e);
        }
    }

    private ChannelManager getChannelManager() {
        ChannelManager channelManager = HstServices.getComponentManager().getComponent(ChannelManager.class.getName());
        if (channelManager != null) {
            return channelManager;
        } else {
            throw new RuntimeException("Unable to get the channels from Channel Manager");
        }
    }

    private Channel getChannel(String channelId) {
        ChannelManager channelManager = HstServices.getComponentManager().getComponent(ChannelManager.class.getName());
        if (channelManager != null) {
            try {
                return channelManager.getChannels().get(channelId);
            } catch (ChannelException e) {
                throw new RuntimeException("Unable to get the channels from Channel Manager", e);
            }
        } else {
            throw new RuntimeException("Unable to get the channels from Channel Manager");
        }
    }

    private HstPropertyDefinition getPropertyDefinition(String propertyName) {
        for (HstPropertyDefinition definition : getBlueprint().getPropertyDefinitions()) {
            if (definition.getName().equals(propertyName)) {
                return definition;
            }
        }
        log.warn("Could not find definition for property '" + propertyName + "'");
        return null;
    }

    @Override
    protected void onRenderProperties(JSONObject properties) throws JSONException {
        super.onRenderProperties(properties);
    }

    /**
     * Abstract model that can store a string in a map under a certain key.
     *
     * @param <T> the type of the model's object
     */
    private abstract class AbstractPropertiesModel<T> implements IModel<T> {

        protected final Map<String, Object> properties;
        protected final String key;

        AbstractPropertiesModel(final Map<String, Object> properties, final String key) {
            this.properties = properties;
            this.key = key;
        }

        protected void setObjectFromString(final String s) {
            HstPropertyDefinition def = getPropertyDefinition(key);
            if (def != null) {
                properties.put(key, def.getValueType().from(s));
            }
        }

        @Override
        public void detach() {
        }

    }

    /**
     * Model that stores a string in a map under a certain key.
     */
    private class StringModel extends AbstractPropertiesModel<String> implements IModel<String> {

        StringModel(final Map<String, Object> properties, final String key) {
            super(properties, key);
        }

        @Override
        public String getObject() {
            Object value = properties.get(key);
            return value == null ? null : value.toString();
        }

        @Override
        public void setObject(String s) {
            setObjectFromString(s);
        }

    }

    /**
     * Model that converts Booleans to strings and stores the strings.
     */
    private class BooleanModel extends AbstractPropertiesModel<Boolean> implements IModel<Boolean> {

        BooleanModel(final Map<String, Object> properties, final String key) {
            super(properties, key);
        }

        @Override
        public Boolean getObject() {
            Object value = properties.get(key);
            return value == null ? null : Boolean.valueOf(value.toString());
        }

        @Override
        public void setObject(final Boolean b) {
            setObjectFromString(b.toString());
        }

    }

    /**
     * Model that converts JCR UUIDs to JCR paths and stores the paths.
     */
    private class UuidFromPathModel extends AbstractPropertiesModel<String> implements IModel<String> {

        UuidFromPathModel(final Map<String, Object> properties, final String key) {
            super(properties, key);
        }

        @Override
        public String getObject() {
            final Object path = properties.get(key);

            if (path != null) {
                javax.jcr.Session session = ((UserSession) Session.get()).getJcrSession();
                try {
                    Node node = session.getNode(path.toString());
                    return node.getIdentifier();
                } catch (RepositoryException e) {
                    log.warn("Cannot retrieve UUID from '" + path + "'", e);
                }
            }

            return null;
        }

        @Override
        public void setObject(final String uuid) {
            if (uuid == null) {
                setObjectFromString(null);
            } else {
                javax.jcr.Session session = ((UserSession) Session.get()).getJcrSession();

                try {
                    Node node = session.getNodeByIdentifier(uuid);
                    setObjectFromString(node.getPath());
                } catch (RepositoryException e) {
                    log.warn("Cannot retrieve node with UUID '" + uuid + "'", e);
                }
            }
        }

    }

}
