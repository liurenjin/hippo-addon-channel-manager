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

package org.onehippo.cms.channelmanager.content.documenttype;

import java.util.Locale;
import java.util.Optional;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;

import org.hippoecm.repository.util.DocumentUtils;
import org.hippoecm.repository.util.JcrUtils;
import org.onehippo.cms.channelmanager.content.documenttype.model.DocumentType;
import org.onehippo.cms.channelmanager.content.documenttype.field.FieldTypeUtils;
import org.onehippo.cms.channelmanager.content.documenttype.util.LocalizationUtils;
import org.onehippo.cms.channelmanager.content.error.ErrorWithPayloadException;
import org.onehippo.cms.channelmanager.content.error.InternalServerErrorException;
import org.onehippo.cms.channelmanager.content.error.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class DocumentTypesServiceImpl implements DocumentTypesService {
    private static final Logger log = LoggerFactory.getLogger(DocumentTypesServiceImpl.class);
    private static final DocumentTypesServiceImpl INSTANCE = new DocumentTypesServiceImpl();

    public static DocumentTypesServiceImpl getInstance() {
        return INSTANCE;
    }

    private DocumentTypesServiceImpl() { }

    @Override
    public DocumentType getDocumentType(final Node handle, final Locale locale)
            throws ErrorWithPayloadException {
        try {
            final String id = DocumentUtils.getVariantNodeType(handle).orElseThrow(NotFoundException::new);

            return getDocumentType(id, handle.getSession(), locale);
        } catch (RepositoryException e) {
            log.warn("Failed to retrieve document type from node '{}'", JcrUtils.getNodePathQuietly(handle), e);
            throw new InternalServerErrorException();
        }
    }

    @Override
    public DocumentType getDocumentType(final String id, final Session userSession, final Locale locale)
            throws ErrorWithPayloadException {
        final DocumentType docType = new DocumentType();
        final ContentTypeContext context = ContentTypeContext.createForDocumentType(id, userSession, locale, docType)
                .orElseThrow(NotFoundException::new);

        if (!context.getContentType().isDocumentType()) {
            log.debug("Requested type '{}' is not document type", id);
            throw new NotFoundException();
        }

        docType.setId(id);
        LocalizationUtils.determineDocumentDisplayName(id, context.getResourceBundle()).ifPresent(docType::setDisplayName);

        FieldTypeUtils.populateFields(docType.getFields(), context);

        return docType;
    }
}
