/*
 * Copyright 2016 Hippo B.V. (http://www.onehippo.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.onehippo.cms.channelmanager.content.documenttype.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;

import org.hippoecm.repository.api.HippoNodeType;
import org.hippoecm.repository.util.JcrUtils;
import org.onehippo.cms.channelmanager.content.documenttype.field.sort.NodeOrderFieldSorter;
import org.onehippo.cms.channelmanager.content.documenttype.field.sort.FieldSorter;
import org.onehippo.cms.channelmanager.content.documenttype.field.sort.TwoColumnFieldSorter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * NamespaceUtils provides utility methods for dealing with repository-based document-type configuration,
 * stored under the /hippo:namespaces root-level node.
 */
public class NamespaceUtils {

    static final String NODE_TYPE_PATH = HippoNodeType.HIPPOSYSEDIT_NODETYPE + "/" + HippoNodeType.HIPPOSYSEDIT_NODETYPE;
    static final String EDITOR_CONFIG_PATH = "editor:templates/_default_";

    private static final Logger log = LoggerFactory.getLogger(NamespaceUtils.class);

    private static final String LAYOUT_PLUGIN_CLASS_ONE_COLUMN = "org.hippoecm.frontend.service.render.ListViewPlugin";
    private static final String LAYOUT_PLUGIN_CLASS_TWO_COLUMN = "org.hippoecm.frontend.editor.layout.TwoColumn";
    private static final Map<String, FieldSorter> LAYOUT_SORTER;

    static {
        LAYOUT_SORTER = new HashMap<>();

        LAYOUT_SORTER.put(LAYOUT_PLUGIN_CLASS_ONE_COLUMN, new NodeOrderFieldSorter());
        LAYOUT_SORTER.put(LAYOUT_PLUGIN_CLASS_TWO_COLUMN, new TwoColumnFieldSorter());
    }

    /**
     * Retrieve the root node of a document type's definition in the repository.
     *
     * @param typeId  ID of a document type, e.g. "myhippoproject:newsdocument"
     * @param session system JCR session meant for read-only access
     * @return        document type root node or nothing, wrapped in an Optional
     */
    public static Optional<Node> getContentTypeRootNode(final String typeId, final Session session) {
        try {
            final String[] part = typeId.split(":");
            if (part.length == 2) {
                final String path = "/hippo:namespaces/" + part[0] + "/" + part[1];
                return Optional.of(session.getNode(path));
            }
        } catch (RepositoryException e) {
            log.debug("Unable to find root node for document type '{}'", typeId, e);
        }
        return Optional.empty();
    }

    /**
     * Retrieve a content type's nodeType node
     *
     * @param contentTypeRootNode JCR root node of the content type
     * @param allowChildless      when set to false and the nodeType node exists but has no children, ignore it
     * @return                    JCR nodeType node or nothing, wrapped in an Optional
     */
    public static Optional<Node> getNodeTypeNode(final Node contentTypeRootNode, final boolean allowChildless) {
        try {
            if (contentTypeRootNode.hasNode(NODE_TYPE_PATH)) {
                final Node nodeTypeNode = contentTypeRootNode.getNode(NODE_TYPE_PATH);
                if (allowChildless || nodeTypeNode.hasNodes()) {
                    return Optional.of(nodeTypeNode);
                }
            }
        } catch (RepositoryException e) {
            log.debug("Failed to find nodeType node for content type '{}'.",
                    JcrUtils.getNodePathQuietly(contentTypeRootNode), e);
        }
        return Optional.empty();
    }

    /**
     * Retrieve the editor configuration node of a content type, given its root node.
     *
     * We suppress the warning because JCR unfortunately defines NodeIterator to be a subclass
     * of the raw Iterator instead of Iterator<Node>.
     *
     * @param contentTypeRootNode root node of the content type
     * @return                    editor config node or nothing, wrapped in an Optional
     */
    @SuppressWarnings("unchecked")
    public static List<Node> getEditorFieldConfigNodes(final Node contentTypeRootNode) {
        final List<Node> editorFieldConfigNodes = new ArrayList<>();
        try {
            if (contentTypeRootNode.hasNode(EDITOR_CONFIG_PATH)) {
                final Node editorConfigNode = contentTypeRootNode.getNode(EDITOR_CONFIG_PATH);

                editorConfigNode.getNodes().forEachRemaining(node -> editorFieldConfigNodes.add((Node)node));
            }
        } catch (RepositoryException e) {
            log.warn("Failed to retrieve editor config node content type '{}'.",
                     JcrUtils.getNodePathQuietly(contentTypeRootNode), e);
        }
        return editorFieldConfigNodes;
    }

    /**
     * Retrieve the "hipposysedit:path" value from a child node of a nodeType node.
     *
     * @param nodeTypeNode JCR nodeType node of a content type
     * @param fieldName    name of the desired child node
     * @return             Value of the path property or nothing, wrapped in an Optional
     */
    public static Optional<String> getPathForNodeTypeField(final Node nodeTypeNode, final String fieldName) {
        try {
            if (nodeTypeNode.hasNode(fieldName)) {
                final Node fieldTypeNode = nodeTypeNode.getNode(fieldName);
                return getStringProperty(fieldTypeNode, HippoNodeType.HIPPO_PATH);
            }
        } catch (RepositoryException e) {
            log.warn("Failed to retrieve child node '{}' from node type node '{}'.", fieldName,
                    JcrUtils.getNodePathQuietly(nodeTypeNode), e);
        }
        return Optional.empty();
    }

    /**
     * Retrieve the (CMS) plugin class in use for a specific field.
     *
     * @param editorFieldConfigNode JCR node representing an editor field (or group of fields)
     * @return                      the plugin class name or nothing, wrapped in an Optional
     */
    public static Optional<String> getPluginClassForField(final Node editorFieldConfigNode) {
        return getStringProperty(editorFieldConfigNode, "plugin.class");
    }

    /**
     * Retrieve the Wicket ID for a specific field
     *
     * @param editorFieldConfigNode JCR node representing an editor field configuration node
     * @return                      the Wicket ID or nothing, wrapped in an Optional
     */
    public static Optional<String> getWicketIdForField(final Node editorFieldConfigNode) {
        return getStringProperty(editorFieldConfigNode, "wicket.id");
    }

    /**
     * Retrieve the "field" property for a specific field
     *
     * @param editorFieldConfigNode JCR node representing an editor field configuration node
     * @return                      valuie of the "field" property or nothing, wrapped in an Optional
     */
    public static Optional<String> getFieldProperty(final Node editorFieldConfigNode) {
        return getStringProperty(editorFieldConfigNode, "field");
    }

    private static Optional<String> getStringProperty(final Node node, final String propertyName) {
        try {
            if (node.hasProperty(propertyName)) {
                return Optional.of(node.getProperty(propertyName).getString());
            }
        } catch (RepositoryException e) {
            log.warn("Failed to read property '{}' from node '{}'.", propertyName,
                    JcrUtils.getNodePathQuietly(node), e);
        }
        return Optional.empty();
    }

    /**
     * Retrieve a sorter for the fields of a content type.
     *
     * @param contentTypeRootNode JCR node representing the root of a content type definition
     * @return                    Appropriate sorter or nothing, wrapped in an Optional
     */
    public static Optional<FieldSorter> retrieveFieldSorter(final Node contentTypeRootNode) {
        try {
            if (contentTypeRootNode.hasNode(EDITOR_CONFIG_PATH)) {
                final Node editorConfigNode = contentTypeRootNode.getNode(EDITOR_CONFIG_PATH);
                if (editorConfigNode.hasNode("root")) {
                    final Node layoutNode = editorConfigNode.getNode("root");
                    final Optional<String> optionalPluginClass = getPluginClassForField(layoutNode);

                    if (optionalPluginClass.isPresent()) {
                        String pluginClass = optionalPluginClass.get();
                        return Optional.of(LAYOUT_SORTER.containsKey(pluginClass)
                                ? LAYOUT_SORTER.get(pluginClass)
                                : LAYOUT_SORTER.get(LAYOUT_PLUGIN_CLASS_ONE_COLUMN));
                    }
                }
                return Optional.of(LAYOUT_SORTER.get(LAYOUT_PLUGIN_CLASS_ONE_COLUMN));
            }
        } catch (RepositoryException e) {
            log.warn("Failed to determine layout of content type {}",
                    JcrUtils.getNodePathQuietly(contentTypeRootNode), e);
        }
        return Optional.empty();
    }
}
