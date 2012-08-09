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

import java.lang.reflect.Field;
import java.security.PrivilegedActionException;
import java.security.PrivilegedExceptionAction;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import javax.jcr.Credentials;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;
import javax.security.auth.Subject;

import org.apache.commons.lang.StringUtils;
import org.apache.wicket.RequestCycle;
import org.apache.wicket.ResourceReference;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.protocol.http.WicketURLEncoder;
import org.apache.wicket.util.string.interpolator.MapVariableInterpolator;
import org.hippoecm.frontend.plugins.standards.ClassResourceModel;
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
import org.wicketstuff.js.ext.data.ActionFailedException;
import org.wicketstuff.js.ext.data.ExtField;
import org.wicketstuff.js.ext.data.ExtGroupingStore;
import org.wicketstuff.js.ext.util.ExtClass;

/**
 * Channel JSON Store.
 */
@ExtClass("Hippo.ChannelManager.ChannelStore")
public class ChannelStore extends ExtGroupingStore<Object> {

    public static final String DEFAULT_TYPE = "website";
    public static final String DEFAULT_CHANNEL_ICON_PATH = "/content/gallery/channels/${name}.png/${name}.png/hippogallery:original";

    // the names are used to access
    // the getters of Channel via reflection
    public enum ChannelField {
        composerModeEnabled,
        contentRoot,
        hostname,
        hstConfigPath,
        hstMountPoint,
        hstPreviewMountPoint,
        id, // channel id
        locale,
        mountId,
        name,
        mountPath,
        cmsPreviewPrefix,
        contextPath,
        url,
        lockedBy,
        lockedOn
    }
    public static final List<String> ALL_FIELD_NAMES;
    public static final List<String> INTERNAL_FIELDS;
    static {
        List<String> names = new ArrayList<String>();
        for (ChannelField field : ChannelField.values()) {
            names.add(field.name());
        }
        ALL_FIELD_NAMES = Collections.unmodifiableList(names);
        INTERNAL_FIELDS = Collections.unmodifiableList(
                                    Arrays.asList(ChannelField.cmsPreviewPrefix.name(),
                                                  ChannelField.hstPreviewMountPoint.name()));
    }

    public static enum SortOrder { ascending, descending }

    /**
     * The first serialized version of this source. Version {@value}.
     */
    private static final long serialVersionUID = 1L;

    private static final Logger log = LoggerFactory.getLogger(ChannelStore.class);
    private transient Map<String, Channel> channels;

    private final String storeId;
    private final String sortFieldName;
    private final SortOrder sortOrder;
    private final LocaleResolver localeResolver;

    private String channelRegionIconPath = DEFAULT_CHANNEL_ICON_PATH;
    private String channelTypeIconPath = DEFAULT_CHANNEL_ICON_PATH;


    public ChannelStore(String storeId, List<ExtField> fields, String sortFieldName, SortOrder sortOrder, LocaleResolver localeResolver) {
        super(fields);
        this.storeId = storeId;
        this.sortFieldName = sortFieldName;
        this.sortOrder = sortOrder;
        this.localeResolver = localeResolver;
    }

    @Override
    protected JSONObject getProperties() throws JSONException {
        //Need the sortinfo and xaction params since we are using GroupingStore instead of
        //JsonStore
        final JSONObject props = super.getProperties();

        props.put("storeId", this.storeId);

        final Map<String, String> sortInfo = new HashMap<String, String>();
        sortInfo.put("field", this.sortFieldName);
        sortInfo.put("direction", this.sortOrder.equals(SortOrder.ascending) ? "ASC" : "DESC");
        props.put("sortInfo", sortInfo);

        final Map<String, String> baseParams = new HashMap<String, String>();
        baseParams.put("xaction", "read");
        props.put("baseParams", baseParams);

        return props;
    }

    @Override
    protected long getTotal() {
        return getChannels().size();
    }

    @Override
    protected JSONArray getData() throws JSONException {
        JSONArray data = new JSONArray();

        for (Channel channel : getChannels().values()) {
            Map<String, Object> channelProperties = channel.getProperties();
            JSONObject object = new JSONObject();
            for (ExtField field : getFields()) {
                String fieldValue = ReflectionUtil.getStringValue(channel, field.getName());
                if (fieldValue == null) {
                    Object value = channelProperties.get(field.getName());
                    fieldValue = value == null ? StringUtils.EMPTY : value.toString();
                }
                object.put(field.getName(), fieldValue);
            }

            populateChannelTypeAndRegion(channel, object);
            
            data.put(object);
        }

        return data;
    }

    private void populateChannelTypeAndRegion(final Channel channel, final JSONObject object) throws JSONException {
        String type = channel.getType();
        if (StringUtils.isEmpty(type)) {
            type = DEFAULT_TYPE;
            channel.setType(DEFAULT_TYPE);
        }
        object.put("channelType", type);

        final Map<String, String> channelFieldValues = getChannelFieldValues(channel);

        String channelIconUrl = getChannelTypeIconUrl(channelFieldValues);
        if (StringUtils.isEmpty(channelIconUrl)) {
            channelIconUrl = getIconResourceReferenceUrl(type+".png");
        }
        object.put("channelTypeImg", channelIconUrl);

        if (StringUtils.isNotEmpty(channel.getLocale())) {
            object.put("channelRegion", channel.getLocale());
            String regionIconUrl = getChannelRegionIconUrl(channelFieldValues);
            if (StringUtils.isEmpty(regionIconUrl)) {
                regionIconUrl = getIconResourceReferenceUrl(channel.getLocale()+".png");
            }
            if (StringUtils.isNotEmpty(regionIconUrl)) {
                object.put("channelRegionImg", regionIconUrl);
            }
        }
    }

    private Map<String, String> getChannelFieldValues(final Channel channel) {
        final Map<String, String> channelFieldValues = new HashMap<String, String>();
        for (Field field : channel.getClass().getDeclaredFields()) {
            if (field.getType() != String.class) {
                continue;
            }
            String fieldValue = ReflectionUtil.getStringValue(channel, field.getName());
            channelFieldValues.put(field.getName(), fieldValue);
        }

        final String locale = channel.getLocale();
        if (locale != null) {
            channelFieldValues.put("locale", locale.toLowerCase());
        }
        return channelFieldValues;
    }

    private String getChannelRegionIconUrl(final Map<String, String> channelFieldValues) {
        MapVariableInterpolator mapVariableInterpolator = new MapVariableInterpolator(this.channelRegionIconPath, channelFieldValues);
        return getChannelIconUrl(mapVariableInterpolator.toString());
    }

    private String getChannelTypeIconUrl(final Map<String, String> channelFieldValues) {
        MapVariableInterpolator mapVariableInterpolator = new MapVariableInterpolator(this.channelTypeIconPath, channelFieldValues);
        return getChannelIconUrl(mapVariableInterpolator.toString());
    }

    private String getChannelIconUrl(final String channelIconPath) {
        if (StringUtils.isEmpty(channelIconPath)) {
            return null;
        }

        Session session = ((UserSession) RequestCycle.get().getSession()).getJcrSession();
        try {
            if (session.nodeExists(channelIconPath)) {
                String url = encodeUrl("binaries" + channelIconPath);
                return RequestCycle.get().getResponse().encodeURL(url).toString();
            }
        } catch (RepositoryException repositoryException) {
            log.error("Error getting the channel icon resource url.", repositoryException);
        }

        return null;
    }

    private final String encodeUrl(String path) {
        String[] elements = StringUtils.split(path, '/');
        for (int i = 0; i < elements.length; i++) {
            elements[i] = WicketURLEncoder.PATH_INSTANCE.encode(elements[i], "UTF-8");
        }
        return StringUtils.join(elements, '/');
    }

    public String getChannelRegionIconPath() {
        return channelRegionIconPath;
    }

    public void setChannelRegionIconPath(final String channelRegionIconPath) {
        this.channelRegionIconPath = channelRegionIconPath;
    }

    public String getChannelTypeIconPath() {
        return this.channelTypeIconPath;
    }

    public void setChannelTypeIconPath(final String channelTypeIconPath) {
        this.channelTypeIconPath = channelTypeIconPath;
    }

    private String getIconResourceReferenceUrl(final String resource) {
        RequestCycle requestCycle = RequestCycle.get();
        ResourceReference iconResource = new ResourceReference(getClass(), resource);
        iconResource.bind(requestCycle.getApplication());
        CharSequence typeImgUrl = requestCycle.urlFor(iconResource);
        return typeImgUrl.toString();
    }

    String getLocalizedFieldName(String fieldName) {
        if (isChannelField(fieldName)) {
            // known field of a Channel; translations are provided by the resource bundle of this class
            return getResourceValue("field." + fieldName);
        }

        // custom channel property; translations are provided by the resource bundle of the custom ChannelInfo class
        Map<String, Channel> channelMap = getChannels();
        for (Channel channel : channelMap.values()) {
            String header = ChannelResourceModel.getChannelResourceValue(channel, fieldName);
            if (header != null) {
                return header;
            }
        }

        // no translation found; is the site down?
        if (ChannelUtil.getChannelManager() == null) {
            log.info("Field '{}' is not a known Channel field, and no custom ChannelInfo class contains a translation of it for locale '{}'. It looks like the site is down. Falling back to the field name itself as the column header.",
                    fieldName, org.apache.wicket.Session.get().getLocale());
        } else {
            log.warn("Field '{}' is not a known Channel field, and no custom ChannelInfo class contains a translation of it for locale '{}'. Falling back to the field name itself as the column header.",
                    fieldName, org.apache.wicket.Session.get().getLocale());
        }

        return fieldName;
    }

    private boolean isChannelField(String fieldName) {
        try {
            ChannelField.valueOf(fieldName);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private static String getResourceValue(String key, Object... parameters) {
        return new ClassResourceModel(key, ChannelStore.class, parameters).getObject();
    }

    public void reload() {
        channels = null;

        AjaxRequestTarget target = AjaxRequestTarget.get();
        if (target != null) {
            target.prependJavascript("Ext.StoreMgr.lookup('" + this.storeId + "').reload();");
        }
    }

	public void update() {
        int previous = getChannelsHash();
        loadChannels();
        if (getChannelsHash() != previous) {
            reload();
        }
    }

    private int getChannelsHash() {
        int hashCode = 0;
        if (channels != null) {
            for (Channel channel : channels.values()) {
                hashCode += channel.toString().hashCode();
            }
        }
        return hashCode;
    }

    public boolean canModifyChannels() {
        final ChannelManager channelManager = ChannelUtil.getChannelManager();
        if (channelManager == null) {
            log.info("Cannot retrieve the channel manager, assuming that the current user cannot modify channels");
            return false;
        }

        Subject subject = createSubject();
        try {
            return HstSubject.doAsPrivileged(subject, new PrivilegedExceptionAction<Boolean>() {
                public Boolean run() throws ChannelException {
                    return channelManager.canUserModifyChannels();
                }
            }, null);
        } catch (PrivilegedActionException e) {
            log.error("Could not determine privileges", e.getException());
            return false;
        } finally {
            HstSubject.clearSubject();
        }
    }

    @Override
    protected JSONObject createRecord(JSONObject record) throws ActionFailedException, JSONException {
        final ChannelManager channelManager = HstServices.getComponentManager().getComponent(ChannelManager.class.getName());

        // create new channel
        final String blueprintId = record.getString("blueprintId");
        final Channel newChannel;
        try {
            newChannel = channelManager.getBlueprint(blueprintId).createChannel();
        } catch (ChannelException e) {
            log.warn("Could not create new channel with blueprint '{}': {}", blueprintId, e.getMessage());
            log.debug("Cause:", e);
            throw new ActionFailedException(getResourceValue("error.blueprint.cannot.create.channel", blueprintId), e);
        }

        // set channel parameters
        final String channelName = record.getString("name");
        newChannel.setName(channelName);
        newChannel.setUrl(record.getString("url"));

        final String contentRoot = record.getString("contentRoot");
        if (StringUtils.isNotEmpty(contentRoot)) {
            newChannel.setContentRoot(contentRoot);

            Locale locale = getLocale(contentRoot);
            if (locale != null) {
                if (StringUtils.isNotBlank(locale.getLanguage())) {
                    newChannel.setLocale(locale.toString());
                } else {
                    log.info("Ignoring locale '{}' of the content root path '{}' of channel '{}': the locale does not define a language",
                            new Object[]{locale, contentRoot, channelName});
                }
            }
        }

        // save channel (FIXME: move boilerplate to CMS engine)
        Subject subject = createSubject();
        try {
            String channelId = HstSubject.doAsPrivileged(subject, new PrivilegedExceptionAction<String>() {
                        public String run() throws ChannelException {
                            return channelManager.persist(blueprintId, newChannel);
                        }
                    }, null);
            log.info("Created new channel with ID '{}'", channelId);
        } catch (PrivilegedActionException e) {
            log.info("Could not persist new channel '" + newChannel.getName() + "'", e.getException());
            throw createActionFailedException(e.getException(), newChannel);
        } finally {
            HstSubject.clearSubject();
        }

        // removed the old cached channels to force a refresh
        this.channels = null;

        // no need to return the create record; it will be loaded when the list of channels is refreshed
        return null;
    }

    private Subject createSubject() {
        UserSession session = (UserSession) org.apache.wicket.Session.get();

        @SuppressWarnings("deprecation")
        Credentials credentials = session.getCredentials();

        Subject subject = new Subject();
        subject.getPrivateCredentials().add(credentials);
        subject.setReadOnly();
        return subject;
    }

    private ActionFailedException createActionFailedException(Exception cause, Channel newChannel) {
        if (cause instanceof ChannelException) {
            ChannelException ce = (ChannelException)cause;
            switch(ce.getType()) {
                case MOUNT_NOT_FOUND:
                case MOUNT_EXISTS:
                    String channelUrl = newChannel.getUrl();
                    String parentUrl = StringUtils.substringBeforeLast(channelUrl, "/");
                    return new ActionFailedException(getResourceValue("channelexception." + ce.getType().getKey(), channelUrl, parentUrl), cause);
                default:
                    return new ActionFailedException(getResourceValue("channelexception." + ce.getType().getKey(), (Object[])ce.getParameters()), cause);
            }
        }
        log.warn("Could not create new channel '" + newChannel.getName() + "': " + cause.getMessage());
        log.debug("Stacktrace:", cause);
        return new ActionFailedException(getResourceValue("error.cannot.create.channel", newChannel.getName()));
    }

    private Map<String, Channel> getChannels() {
        if (channels == null) {
            // reload channels
            loadChannels();
        }
        return channels;
    }

    private void loadChannels() {
        ChannelManager channelManager = ChannelUtil.getChannelManager();
        if (channelManager == null) {
            log.info("Cannot load the channel manager. No channels will be shown.");
            channels = Collections.emptyMap();
        } else {
            try {
                channels = channelManager.getChannels();
            } catch (ChannelException e) {
                log.error("Failed to retrieve channels", e);
                channels = Collections.emptyMap();
            }
        }
    }

    private Locale getLocale(String absPath) {
        if (StringUtils.isEmpty(absPath)) {
            return null;
        }
        javax.jcr.Session session = ((UserSession) org.apache.wicket.Session.get()).getJcrSession();
        try {
            if (!session.nodeExists(absPath)) {
                return null;
            }
            Node node = session.getNode(absPath);
            return localeResolver.getLocale(node);
        } catch (RepositoryException e) {
            log.warn("Could not retrieve the locale of node '" + absPath + "'", e);
        }
        return null;
    }

}
