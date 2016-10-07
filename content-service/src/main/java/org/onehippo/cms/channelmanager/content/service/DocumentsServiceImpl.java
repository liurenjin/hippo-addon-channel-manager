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

package org.onehippo.cms.channelmanager.content.service;

import java.util.Locale;

import javax.jcr.Node;
import javax.jcr.Session;

import org.hippoecm.repository.standardworkflow.EditableWorkflow;
import org.hippoecm.repository.util.DocumentUtils;
import org.hippoecm.repository.util.WorkflowUtils;
import org.onehippo.cms.channelmanager.content.exception.DocumentNotFoundException;
import org.onehippo.cms.channelmanager.content.exception.DocumentTypeNotFoundException;
import org.onehippo.cms.channelmanager.content.model.document.Document;
import org.onehippo.cms.channelmanager.content.model.document.DocumentInfo;
import org.onehippo.cms.channelmanager.content.model.documenttype.DocumentType;
import org.onehippo.cms.channelmanager.content.model.document.EditingInfo;
import org.onehippo.cms.channelmanager.content.model.documenttype.FieldType;
import org.onehippo.cms.channelmanager.content.util.EditingUtils;
import org.onehippo.cms.channelmanager.content.util.MockResponse;

public class DocumentsServiceImpl implements DocumentsService {
    private static final DocumentsService INSTANCE = new DocumentsServiceImpl();

    static DocumentsService getInstance() {
        return INSTANCE;
    }

    private DocumentsServiceImpl() { }

    @Override
    public Document getDocument(final String uuid, final Session session, final Locale locale)
            throws DocumentNotFoundException {
        if ("test".equals(uuid)) {
            return MockResponse.createTestDocument(uuid);
        }

        final Node handle = DocumentUtils.getHandle(uuid, session).orElseThrow(DocumentNotFoundException::new);
        final DocumentType docType = getDocumentType(handle, locale);
        final EditableWorkflow workflow = WorkflowUtils.getWorkflow(handle, "editing", EditableWorkflow.class)
                                                       .orElseThrow(DocumentNotFoundException::new);
        final EditingInfo editingInfo = EditingUtils.determineEditingInfo(workflow, handle);
        final Node variant = EditingUtils.getOrMakeDraft(editingInfo, workflow, handle)
                                         .orElseThrow(DocumentNotFoundException::new);
        final DocumentInfo documentInfo = new DocumentInfo();

        documentInfo.setTypeId(docType.getId());
        documentInfo.setEditingInfo(editingInfo);

        final Document document = new Document();

        document.setId(uuid);
        document.setInfo(documentInfo);
        DocumentUtils.getDisplayName(handle).ifPresent(document::setDisplayName);

        for (FieldType field : docType.getFields()) {
            field.readFrom(variant).ifPresent(value -> document.addField(field.getId(), value));
        }

        return document;
    }

    private DocumentType getDocumentType(final Node handle, final Locale locale)
            throws DocumentNotFoundException {
        try {
            return DocumentTypesService.get().getDocumentType(handle, locale);
        } catch (DocumentTypeNotFoundException e) {
            throw new DocumentNotFoundException();
        }
    }
}
