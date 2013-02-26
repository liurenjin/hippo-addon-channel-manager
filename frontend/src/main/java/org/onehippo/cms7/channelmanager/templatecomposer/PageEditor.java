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
package org.onehippo.cms7.channelmanager.templatecomposer;

import java.security.AccessControlException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.jcr.ItemNotFoundException;
import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Value;

import org.apache.jackrabbit.commons.iterator.NodeIterable;
import org.apache.wicket.Application;
import org.apache.wicket.RequestCycle;
import org.apache.wicket.ResourceReference;
import org.apache.wicket.Session;
import org.apache.wicket.WicketRuntimeException;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.markup.html.CSSPackageResource;
import org.apache.wicket.model.Model;
import org.apache.wicket.util.string.Strings;
import org.hippoecm.frontend.PluginRequestTarget;
import org.hippoecm.frontend.js.GlobalJsResourceBehavior;
import org.hippoecm.frontend.model.JcrNodeModel;
import org.hippoecm.frontend.model.event.IObserver;
import org.hippoecm.frontend.model.event.Observer;
import org.hippoecm.frontend.plugin.IPluginContext;
import org.hippoecm.frontend.plugin.config.IPluginConfig;
import org.hippoecm.frontend.service.EditorException;
import org.hippoecm.frontend.service.IEditor;
import org.hippoecm.frontend.service.IEditorManager;
import org.hippoecm.frontend.service.ServiceException;
import org.hippoecm.frontend.session.UserSession;
import org.hippoecm.hst.core.container.ContainerConstants;
import org.hippoecm.repository.api.HippoNodeType;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.onehippo.cms7.channelmanager.ExtStoreFuture;
import org.onehippo.cms7.channelmanager.channels.ChannelPropertiesWindow;
import org.onehippo.cms7.channelmanager.channels.ChannelStore;
import org.onehippo.cms7.channelmanager.hstconfig.HstConfigEditor;
import org.onehippo.cms7.channelmanager.templatecomposer.iframe.IFrameBundle;
import org.onehippo.cms7.jquery.JQueryBundle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.wicketstuff.js.ext.ExtEventAjaxBehavior;
import org.wicketstuff.js.ext.ExtPanel;
import org.wicketstuff.js.ext.util.ExtClass;
import org.wicketstuff.js.ext.util.ExtEventListener;
import org.wicketstuff.js.ext.util.ExtProperty;
import org.wicketstuff.js.ext.util.ExtPropertyConverter;
import org.wicketstuff.js.ext.util.JSONIdentifier;

@ExtClass("Hippo.ChannelManager.TemplateComposer.PageEditor")
public class PageEditor extends ExtPanel {

    private static final Logger log = LoggerFactory.getLogger(PageEditor.class);
    private static final long serialVersionUID = 1L;

    // default initial connection timeout in milliseconds
    private static final long DEFAULT_INITIAL_CONNECTION_TIMEOUT = 60000L;

    private static final String SELECT_ADMIN_GROUPS_QUERY = "SELECT * FROM hipposys:group WHERE jcr:primaryType='hipposys:group' AND fn:name() = 'admin' AND hipposys:members='{}'";

    @ExtProperty
    private Boolean debug = false;

    @ExtProperty
    private String composerRestMountPath = "/_rp";

    @ExtProperty
    private String renderPathInfo = "";

    @ExtProperty
    private String contextPath = "/site";

    @ExtProperty
    private String cmsPreviewPrefix;

    @ExtProperty
    private String templateComposerContextPath = "/site";

    @ExtProperty
    private String renderHostParameterName = ContainerConstants.RENDERING_HOST;

    @ExtProperty
    private String cmsUser;

    @ExtProperty
    @SuppressWarnings("unused")
    private Boolean canUnlockChannels = Boolean.FALSE;

    @ExtProperty
    private Boolean previewMode = Boolean.TRUE;

    @ExtProperty
    private Long initialHstConnectionTimeout = DEFAULT_INITIAL_CONNECTION_TIMEOUT;

    @ExtProperty
    private String locale;

    private IPluginContext context;
    private ExtStoreFuture channelStoreFuture;
    private ChannelPropertiesWindow channelPropertiesWindow;
    private boolean redraw = false;
    private List<Observer> observers = new ArrayList<Observer>();

    @ExtProperty
    private String channelId;

    @ExtProperty
    private Boolean initializeHstConfigEditorWithPreviewContext = Boolean.TRUE;

    private boolean refreshIFrame;

    public PageEditor(final IPluginContext context, final IPluginConfig config, final HstConfigEditor hstConfigEditor, final ExtStoreFuture<Object> channelStoreFuture) {
        this.context = context;
        this.channelStoreFuture = channelStoreFuture;
        if (config != null) {
            this.composerRestMountPath = config.getString("composerRestMountPath", composerRestMountPath);
            this.templateComposerContextPath = config.getString("templateComposerContextPath", templateComposerContextPath);
            this.contextPath = config.getString("contextPath", contextPath);
            this.initialHstConnectionTimeout = config.getLong("initialHstConnectionTimeout", DEFAULT_INITIAL_CONNECTION_TIMEOUT);
            if (config.get("previewMode") != null) {
                this.previewMode = config.getBoolean("previewMode");
            }
            if (config.containsKey("initializeHstConfigEditorWithPreviewContext")) {
                this.initializeHstConfigEditorWithPreviewContext = config.getBoolean("initializeHstConfigEditorWithPreviewContext");
            }

            // Check whether user can unlock channels or not
            try {
                final String unlocckChannelPrivilege = config.getString("channel.unlock.privileges", "hippo:admin");
                final String unlocckChannelPathToCheck = config.getString("channel.unlock.privileges.path", "/hst:hst/hst:channels");
                UserSession.get().getJcrSession().checkPermission(unlocckChannelPathToCheck, unlocckChannelPrivilege);
                this.canUnlockChannels = true;
            } catch(AccessControlException ex) {
                log.info("User '{}' is not allowed to unlock channels.", this.cmsUser);
            } catch (RepositoryException ex) {
                if (log.isDebugEnabled()) {
                    log.warn("Problems while checking if user '" + this.cmsUser + "' can unlock channels or not", ex);
                } else {
                    log.warn("Problems while checking if user '{}' can unlock channels or not. {}", this.cmsUser, ex);
                }
            }
        }

        this.debug = Application.get().getDebugSettings().isAjaxDebugModeEnabled();
        this.locale = Session.get().getLocale().toString();
        this.cmsUser = UserSession.get().getJcrSession().getUserID();

        add(CSSPackageResource.getHeaderContribution(PageEditor.class, "plugins/colorfield/colorfield.css"));
        add(new TemplateComposerResourceBehavior());

        this.channelPropertiesWindow = new ChannelPropertiesWindow(context, (ChannelStore) channelStoreFuture.getStore());
        add(this.channelPropertiesWindow);

        addEventListener("edit-document", new ExtEventListener() {
            @Override
            public void onEvent(final AjaxRequestTarget target, final Map<String, JSONArray> parameters) {
                JSONArray values = parameters.get("uuid");
                if (values == null || values.length() == 0) {
                    return;
                }
                try {
                    final Object value = values.get(0);
                    String editorManagerServiceId = config != null ? config.getString(IEditorManager.EDITOR_ID,
                                                                                      "service.edit") : "service.edit";
                    IEditorManager editorManager = context.getService(editorManagerServiceId, IEditorManager.class);
                    JcrNodeModel model = new JcrNodeModel(
                            UserSession.get().getJcrSession().getNodeByIdentifier(value.toString()));
                    IEditor<?> editor = editorManager.getEditor(model);
                    if (editor == null) {
                        editor = editorManager.openEditor(model);
                    }
                    editor.setMode(IEditor.Mode.EDIT);
                    editor.focus();
                    target.appendJavascript("Hippo.ChannelManager.TemplateComposer.Instance.perspectiveActive = false;");
                } catch (JSONException e) {
                    throw new WicketRuntimeException("Invalid JSON parameters", e);
                } catch (ItemNotFoundException e) {
                    log.warn("Could not find document to browse to", e);
                } catch (RepositoryException e) {
                    log.error("Internal error when browsing to document", e);
                } catch (EditorException e) {
                    log.error("Could not open editor for document", e);
                } catch (ServiceException e) {
                    log.error("Opening editor failed", e);
                }

            }
        });

        addEventListener("edit-hst-config", new ExtEventListener() {

            private Object getValue(final Map<String, JSONArray> parameters, final String key) throws JSONException {
                JSONArray values = parameters.get(key);
                if (values == null || values.length() == 0) {
                    return null;
                }
                return values.get(0);
            }

            @Override
            public void onEvent(final AjaxRequestTarget target, final Map<String, JSONArray> parameters) {
                try {
                    final String paramChannelId = (String) getValue(parameters, "channelId");
                    final String paramHstMountPoint = (String) getValue(parameters, "hstMountPoint");
                    target.prependJavascript("Ext.getCmp('Hippo.ChannelManager.HstConfigEditor.Instance').initEditor();");
                    hstConfigEditor.setMountPoint(target, paramChannelId, paramHstMountPoint);
                } catch (JSONException e) {
                    throw new WicketRuntimeException("Invalid JSON parameters", e);
                }
            }
        });

        addEventListener("documents", new ExtEventListener() {
            @Override
            public void onEvent(final AjaxRequestTarget target, final Map<String, JSONArray> parameters) {
                clearObservers();

                JSONArray values = parameters.get("documents");
                if (values == null || values.length() == 0) {
                    return;
                }
                try {
                    for (int i = 0; i < values.length(); i++) {
                        String uuid = values.getString(i);
                        if (Strings.isEmpty(uuid)) {
                            continue;
                        }
                        addDocumentObservers(uuid);
                    }
                } catch (JSONException e) {
                    throw new WicketRuntimeException("Invalid JSON parameters", e);
                }
            }
        });
    }

    private void addDocumentObservers(final String uuid) {
        try {
            Node node = UserSession.get().getJcrSession().getNodeByIdentifier(uuid);
            addObserver(node);
            if (node.isNodeType(HippoNodeType.NT_HANDLE)) {
                for (Node child : new NodeIterable(node.getNodes())) {
                    if (child.isNodeType(HippoNodeType.NT_DOCUMENT)) {
                        if (child.hasProperty(HippoNodeType.HIPPO_AVAILABILITY)) {
                            Value[] availabilities = child.getProperty(HippoNodeType.HIPPO_AVAILABILITY).getValues();
                            for (Value availability : availabilities) {
                                if ("preview".equals(availability.getString())) {
                                    addObserver(child);
                                    break;
                                }
                            }
                        } else {
                            addObserver(child);
                        }
                    }
                }
            }
        } catch (RepositoryException re) {
            log.warn("Unable to construct node model for document {}", uuid);
        }
    }

    private void addObserver(final Node node) {
        JcrNodeModel nodeModel = new JcrNodeModel(node);
        Observer<JcrNodeModel> observer = new DocumentObserver(nodeModel);
        context.registerService(observer, IObserver.class.getName());
        observers.add(observer);
    }

    private void clearObservers() {
        for (Observer observer : observers) {
            context.unregisterService(observer, IObserver.class.getName());
        }
        observers.clear();
    }

    @Override
    public void buildInstantiationJs(StringBuilder js, String extClass, JSONObject properties) {
        js.append(String.format(
                " try { Ext.namespace(\"%s\"); window.%s = new %s(%s); } catch (e) { Ext.Msg.alert('Error', 'Error instantiating template composer. '+e); }; \n",
                getMarkupId(), getMarkupId(), extClass, properties.toString()));
    }

    @Override
    public String getMarkupId() {
        return "Hippo.ChannelManager.TemplateComposer.Instance";
    }

    @Override
    protected void onRenderProperties(final JSONObject properties) throws JSONException {
        super.onRenderProperties(properties);
        RequestCycle rc = RequestCycle.get();
        properties.put("channelPropertiesWindowId", this.channelPropertiesWindow.getMarkupId());
        properties.put("channelStoreFuture", new JSONIdentifier(this.channelStoreFuture.getJsObjectId()));
        properties.put("iFrameErrorPage", Arrays.asList(
                rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.ERROR_HTML)).toString()));
        properties.put("iFrameCssHeadContributions", Arrays.asList(
                rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.CHANNEL_MANAGER_IFRAME_CSS)).toString()));
        if (debug) {
            properties.put("iFrameJsHeadContributions", Arrays.asList(
                    rc.urlFor(new ResourceReference(JQueryBundle.class, JQueryBundle.JQUERY_CORE)).toString(),
                    rc.urlFor(new ResourceReference(JQueryBundle.class, JQueryBundle.JQUERY_CLASS_PLUGIN)).toString(),
                    rc.urlFor(
                            new ResourceReference(JQueryBundle.class, JQueryBundle.JQUERY_NAMESPACE_PLUGIN)).toString(),
                    rc.urlFor(new ResourceReference(JQueryBundle.class, JQueryBundle.JQUERY_UI)).toString(),
                    rc.urlFor(new ResourceReference(GlobalJsResourceBehavior.class, GlobalJsResourceBehavior.GLOBAL)).toString(),
                    rc.urlFor(new ResourceReference(PageEditor.class, "globals.js")).toString(),
                    rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.MAIN)).toString(),
                    rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.UTIL)).toString(),
                    rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.FACTORY)).toString(),
                    rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.PAGE)).toString(),
                    rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.WIDGETS)).toString(),
                    rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.SURFANDEDIT)).toString()));
        } else {
            properties.put("iFrameJsHeadContributions", Arrays.asList(
                    rc.urlFor(new ResourceReference(JQueryBundle.class, JQueryBundle.JQUERY_ALL_MIN)).toString(),
                    rc.urlFor(new ResourceReference(GlobalJsResourceBehavior.class, GlobalJsResourceBehavior.GLOBAL)).toString(),
                    rc.urlFor(new ResourceReference(IFrameBundle.class, IFrameBundle.ALL)).toString()));
        }
    }

    @Override
    protected ExtEventAjaxBehavior newExtEventBehavior(final String event) {
        if ("edit-document".equals(event)) {
            return new ExtEventAjaxBehavior("uuid");
        } else if ("edit-hst-config".equals(event)) {
            return new ExtEventAjaxBehavior("channelId", "hstMountPoint");
        } else if ("documents".equals(event)) {
            return new ExtEventAjaxBehavior("documents");
        }
        return super.newExtEventBehavior(event);
    }

    public void redraw() {
        redraw = true;
        clearObservers();
    }

    public void render(PluginRequestTarget target) {
        if (redraw) {
            JSONObject update = new JSONObject();
            ExtPropertyConverter.addProperties(this, getClass(), update);
            target.appendJavascript("Ext.getCmp('" + getMarkupId() + "').browseTo(" + update.toString() + ");");
            redraw = false;
        } else if (refreshIFrame) {
            refreshIFrame = false;
            target.appendJavascript("Ext.getCmp('" + getMarkupId() + "').refreshIframe();");
        }
    }

    public void setChannel(final String channelId) {
        this.channelId = channelId;
        redraw();
    }

    public void setChannelName(String name) {
        setTitle(new Model(name));
        redraw();
    }

    public Boolean getPreviewMode() {
        return previewMode;
    }

    public void setPreviewMode(final Boolean previewMode) {
        this.previewMode = previewMode;
        redraw();
    }

    public void setRenderPathInfo(String pathInfo) {
        this.renderPathInfo = pathInfo;
        redraw();
    }
    
    public void setRenderContextPath(String contextPath) {
        this.contextPath = contextPath;
        redraw();
    }
    
    public void setTemplateComposerContextPath(String templateComposerContextPath) {
        this.templateComposerContextPath = templateComposerContextPath;
        redraw();
    }

    public String getCmsPreviewPrefix() {
        return cmsPreviewPrefix;
    }

    public void setCmsPreviewPrefix(final String cmsPreviewPrefix) {
        this.cmsPreviewPrefix = cmsPreviewPrefix;
    }

    @Override
    protected void onDetach() {
        super.onDetach();

        for (Observer<JcrNodeModel> observer : observers) {
            observer.getObservable().detach();
        }
    }

    private class DocumentObserver extends Observer<JcrNodeModel> {

        public DocumentObserver(final JcrNodeModel nodeModel) {
            super(nodeModel);
        }

        @Override
        public void onEvent(final Iterator events) {
            refreshIFrame();
        }
    }

    private void refreshIFrame() {
        refreshIFrame = true;
    }

}
