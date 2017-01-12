/*
 * Copyright 2017 Hippo B.V. (http://www.onehippo.com)
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

package org.onehippo.cms.channelmanager.content.documenttype.field.type;

import org.hippoecm.repository.util.NodeIterable;
import org.hippoecm.repository.util.PropertyIterable;
import org.onehippo.cms.channelmanager.content.document.model.FieldValue;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.Node;
import javax.jcr.Property;
import javax.jcr.RepositoryException;
import java.util.*;

public class RichTextFieldType extends StringFieldType {

    private static final Logger log = LoggerFactory.getLogger(RichTextFieldType.class);
    private static final String HIPPOSTD_CONTENT = "hippostd:content";

    public RichTextFieldType() {
        super();
        setType(Type.RICH_TEXT);
    }

    @Override
    public Optional<List<FieldValue>> readFrom(final Node node) {
        final List<FieldValue> values = readSingleValue(node);

        trimToMaxValues(values);

        return values.isEmpty() ? Optional.empty() : Optional.of(values);
    }

    private List<FieldValue> readSingleValue(final Node node) {
        final String nodeName = getId();
        final List<FieldValue> values = new ArrayList<>();
        final Map<String, List<FieldValue>> linkedDocuments = new HashMap<>();

        try {
            final Node child = node.getNode(nodeName);
            if (child.hasProperty(HIPPOSTD_CONTENT)) {
                values.add(new FieldValue(child.getProperty(HIPPOSTD_CONTENT).getString()));
            }
            for (final Node subNode : new NodeIterable(child.getNodes())) {
                saveLinkedDocuments(linkedDocuments, subNode);
            }
            values.add(new FieldValue(linkedDocuments));
        } catch (final RepositoryException e) {
            log.warn("Failed to read nodes for Rich Text Field type '{}'", getId(), e);
        }
        return values;
    }

    private static void saveLinkedDocuments(final Map<String, List<FieldValue>> linkedDocuments, final Node subNode) throws RepositoryException {
        final List<FieldValue> properties = new ArrayList<>();
        for (final Property property : new PropertyIterable(subNode.getProperties())) {
            storeProperty(properties, property);
        }
        linkedDocuments.put(subNode.getName(), properties);
    }

}
