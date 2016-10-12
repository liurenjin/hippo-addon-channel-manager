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

package org.onehippo.cms.channelmanager.content.model.documenttype;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Value;

import org.hippoecm.repository.util.JcrUtils;
import org.onehippo.cms.channelmanager.content.util.ContentTypeContext;
import org.onehippo.cms.channelmanager.content.util.FieldTypeContext;
import org.onehippo.cms.channelmanager.content.util.FieldTypeUtils;
import org.onehippo.cms.channelmanager.content.util.FieldValidators;
import org.onehippo.cms.channelmanager.content.util.LocalizationUtils;
import org.onehippo.cms7.services.contenttype.ContentTypeItem;
import org.onehippo.repository.l10n.ResourceBundle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class StringFieldType extends PropertyFieldType {

    private static final Logger log = LoggerFactory.getLogger(StringFieldType.class);

    public StringFieldType() {
        this.setType(Type.STRING);
    }

    @Override
    public Optional<Object> readFrom(final Node node) {
        final String property = getId();
        try {
            if (node.hasProperty(property)) {
                if (isStoredAsMultiValueProperty()) {
                    final List<String> values = new ArrayList<>();
                    for (Value v : node.getProperty(property).getValues()) {
                        values.add(v.getString());
                    }
                    if (!values.isEmpty()) {
                        return Optional.of(values);
                    }
                } else {
                    return Optional.of(node.getProperty(property).getString());
                }
            }
        } catch (RepositoryException e) {
            log.warn("Failed to read string field '{}' from '{}'", property, JcrUtils.getNodePathQuietly(node), e);
        }
        return Optional.empty();
    }
}
