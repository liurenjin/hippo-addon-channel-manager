/*
 *  Copyright 2011-2013 Hippo B.V. (http://www.onehippo.com)
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
package org.onehippo.cms7.channelmanager.plugins.channelactions;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Value;
import javax.ws.rs.WebApplicationException;

import org.apache.wicket.Component;
import org.apache.wicket.IClusterable;
import org.apache.wicket.MarkupContainer;
import org.apache.wicket.ResourceReference;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.list.ListItem;
import org.apache.wicket.markup.html.list.ListView;
import org.apache.wicket.markup.html.panel.EmptyPanel;
import org.apache.wicket.markup.html.panel.Fragment;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.LoadableDetachableModel;
import org.apache.wicket.model.StringResourceModel;
import org.hippoecm.addon.workflow.CompatibilityWorkflowPlugin;
import org.hippoecm.addon.workflow.MenuDescription;
import org.hippoecm.addon.workflow.StdWorkflow;
import org.hippoecm.addon.workflow.WorkflowDescriptorModel;
import org.hippoecm.frontend.plugin.IPluginContext;
import org.hippoecm.frontend.plugin.config.IPluginConfig;
import org.hippoecm.frontend.service.IRestProxyService;
import org.hippoecm.hst.rest.DocumentService;
import org.hippoecm.hst.rest.beans.ChannelDocument;
import org.hippoecm.repository.api.HippoNodeType;
import org.hippoecm.repository.api.Workflow;
import org.onehippo.cms7.channelmanager.service.IChannelManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.onehippo.cms7.channelmanager.ChannelManagerConsts.CONFIG_REST_PROXY_SERVICE_ID;

@SuppressWarnings({ "deprecation", "serial" })
public class ChannelActionsPlugin extends CompatibilityWorkflowPlugin<Workflow> {

    private static final Logger log = LoggerFactory.getLogger(ChannelActionsPlugin.class);
    private static final Comparator<ChannelDocument> DEFAULT_CHANNEL_DOCUMENT_COMPARATOR = new ChannelDocumentNameComparator();

    public static final String CONFIG_CHANNEL_MANAGER_SERVICE_ID = "channel.manager.service.id";

    private final IRestProxyService restProxyService;
    private final IChannelManagerService channelManagerService;

    public ChannelActionsPlugin(IPluginContext context, IPluginConfig config) {
        super(context, config);

        restProxyService = loadService("REST proxy service", CONFIG_REST_PROXY_SERVICE_ID, IRestProxyService.class);
        channelManagerService = loadService("channel manager service", CONFIG_CHANNEL_MANAGER_SERVICE_ID, IChannelManagerService.class);

        final WorkflowDescriptorModel model = (WorkflowDescriptorModel) getDefaultModel();
        if (model != null) {
            try {
                Node node = model.getNode();
                if (isVisibleInPreview(node)) {
                    addMenuDescription(model);
                }
            } catch (RepositoryException e) {
                log.error("Error getting document node from WorkflowDescriptorModel", e);
            }
        }
        add(new EmptyPanel("content"));
    }

    private void addMenuDescription(final WorkflowDescriptorModel model) {
        add(new MenuDescription() {
            private static final long serialVersionUID = 1L;

            @Override
            public Component getLabel() {
                Fragment fragment = new Fragment("label", "description", ChannelActionsPlugin.this);
                fragment.add(new Label("label", new StringResourceModel("label", ChannelActionsPlugin.this, null)));
                return fragment;
            }

            @Override
            public MarkupContainer getContent() {
                Fragment fragment = new Fragment("content", "actions", ChannelActionsPlugin.this);
                try {
                    Node node = model.getNode();
                    String handleUuid = node.getParent().getIdentifier();
                    fragment.add(createMenu(handleUuid));
                } catch (RepositoryException e) {
                    log.warn("Unable to create channel menu", e);
                    fragment.addOrReplace(new EmptyPanel("channels"));
                }
                ChannelActionsPlugin.this.addOrReplace(fragment);
                return fragment;
            }
        });
    }

    private <T extends IClusterable> T loadService(final String name, final String configServiceId, final Class<T> clazz) {
        final String serviceId = getPluginConfig().getString(configServiceId, clazz.getName());
        log.debug("Using {} with id '{}'", name, serviceId);

        final T service = getPluginContext().getService(serviceId, clazz);
        if (service == null) {
            log.warn("Could not get service '{}' of type {}", serviceId, clazz.getName());
            throw new IllegalStateException("Could not find/load service '" + serviceId + "' of type " + clazz.getName());
        }

        return service;
    }

    private MarkupContainer createMenu(String documentUuid) {
        final DocumentService documentService = restProxyService.createRestProxy(DocumentService.class);
        if (documentService != null) {
            try {
                final List<ChannelDocument> channelDocuments = documentService.getChannels(documentUuid);
                Collections.sort(channelDocuments, getChannelDocumentComparator());

                final Map<String, ChannelDocument> idToChannelMap = new LinkedHashMap<String, ChannelDocument>();
                for (ChannelDocument channelDocument : channelDocuments) {
                    idToChannelMap.put(channelDocument.getChannelId(), channelDocument);
                }

                return new ListView<String>("channels", new LoadableDetachableModel<List<String>>() {

                    @Override
                    protected List<String> load() {
                        List<String> names = new ArrayList<String>();
                        names.addAll(idToChannelMap.keySet());
                        return names;
                    }

                }) {

                    {
                        onPopulate();
                    }

                    @Override
                    protected void populateItem(final ListItem<String> item) {
                        final String channelId = item.getModelObject();
                        ChannelDocument channel = idToChannelMap.get(channelId);
                        item.add(new ViewChannelAction("view-channel", channel));
                    }
                };
            } catch (WebApplicationException e) {
                log.error("Could not initialize channel actions menu, REST proxy returned status code '{}'",
                        e.getResponse().getStatus());

                log.debug("REST proxy returned message: {}", e.getMessage());
           }
        } else {
            log.warn("The REST proxy service does provide a proxy for class '{}'. As a result, the 'View' menu cannot be populated with the channels for the document with UUID '{}'",
                     DocumentService.class.getCanonicalName(), documentUuid);
        }
        return new EmptyPanel("channels");
    }

    protected Comparator<ChannelDocument> getChannelDocumentComparator() {
        return DEFAULT_CHANNEL_DOCUMENT_COMPARATOR;
    }

    private static boolean isVisibleInPreview(Node documentNode) {
        try {
            if (documentNode.hasProperty(HippoNodeType.HIPPO_AVAILABILITY)) {
                for (Value availability : documentNode.getProperty(HippoNodeType.HIPPO_AVAILABILITY).getValues()) {
                    if ("preview".equals(availability.getString())) {
                        return true;
                    }
                }
            } else {
                log.warn("Document '{}' does not contain the property '{}'. No 'View' menu items will be shown.",
                        documentNode.getPath(), HippoNodeType.HIPPO_AVAILABILITY);
            }
        } catch (RepositoryException e) {
            log.error("Error getting " + HippoNodeType.HIPPO_AVAILABILITY + " property from document", e);
        }
        return false;
    }


    private class ViewChannelAction extends StdWorkflow {

        private static final long serialVersionUID = 1L;
        private ChannelDocument channelDocument;

        ViewChannelAction(String id, ChannelDocument channelDocument) {
            super(id, "channelactions");
            this.channelDocument = channelDocument;
        }

        @Override
        protected IModel<String> getTitle() {
            return new LoadableDetachableModel<String>() {
                private static final long serialVersionUID = 1L;

                @Override
                protected String load() {
                    return channelDocument.getChannelName();
                }
            };
        }

        @Override
        protected ResourceReference getIcon() {
            return new ResourceReference(getClass(), "channel-icon-16.png");
        }

        @Override
        protected void invoke() {
            // create the pathInfo of the channel manager url. The pathInfo includes the mountPath & path after the mount
            StringBuilder pathInfo  = new StringBuilder(channelDocument.getMountPath()).append(channelDocument.getPathInfo());
            channelManagerService.viewChannel(channelDocument.getChannelId(), pathInfo.toString(), channelDocument.getContextPath(), channelDocument.getCmsPreviewPrefix() ,channelDocument.getTemplateComposerContextPath());
        }
    }

    protected static class ChannelDocumentNameComparator implements Comparator<ChannelDocument>, Serializable {

        @Override
        public int compare(final ChannelDocument o1, final ChannelDocument o2) {
            return o1.getChannelName().compareTo(o2.getChannelName());
        }

    }

}
