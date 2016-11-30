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

package org.onehippo.cms.channelmanager.content.document;

import java.rmi.RemoteException;
import java.util.Locale;

import javax.jcr.Node;
import javax.jcr.RepositoryException;
import javax.jcr.Session;

import org.hippoecm.repository.api.HippoNodeType;
import org.hippoecm.repository.api.WorkflowException;
import org.hippoecm.repository.standardworkflow.EditableWorkflow;
import org.hippoecm.repository.util.DocumentUtils;
import org.hippoecm.repository.util.JcrUtils;
import org.hippoecm.repository.util.WorkflowUtils;
import org.onehippo.cms.channelmanager.content.document.model.Document;
import org.onehippo.cms.channelmanager.content.document.model.DocumentInfo;
import org.onehippo.cms.channelmanager.content.document.model.EditingInfo;
import org.onehippo.cms.channelmanager.content.documenttype.field.FieldTypeUtils;
import org.onehippo.cms.channelmanager.content.error.ErrorInfo;
import org.onehippo.cms.channelmanager.content.documenttype.DocumentTypesService;
import org.onehippo.cms.channelmanager.content.documenttype.model.DocumentType;
import org.onehippo.cms.channelmanager.content.document.util.EditingUtils;
import org.onehippo.cms.channelmanager.content.error.BadRequestException;
import org.onehippo.cms.channelmanager.content.error.ErrorWithPayloadException;
import org.onehippo.cms.channelmanager.content.error.ForbiddenException;
import org.onehippo.cms.channelmanager.content.error.InternalServerErrorException;
import org.onehippo.cms.channelmanager.content.error.MethodNotAllowed;
import org.onehippo.cms.channelmanager.content.error.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class DocumentsServiceImpl implements DocumentsService {
    private static final Logger log = LoggerFactory.getLogger(DocumentsServiceImpl.class);
    private static final String WORKFLOW_CATEGORY_EDIT = "editing";
    private static final DocumentsService INSTANCE = new DocumentsServiceImpl();

    static DocumentsService getInstance() {
        return INSTANCE;
    }

    private DocumentsServiceImpl() { }

    @Override
    public Document createDraft(final String uuid, final Session session, final Locale locale)
            throws ErrorWithPayloadException {
        final Node handle = getHandle(uuid, session);
        final EditableWorkflow workflow = getWorkflow(handle);
        final DocumentType docType = getDocumentType(handle, locale);
        final Document document = assembleDocument(uuid, handle, workflow, docType);
        final EditingInfo editingInfo = document.getInfo().getEditingInfo();
        if (editingInfo.getState() != EditingInfo.State.AVAILABLE) {
            throw new ForbiddenException(document);
        }

        if (docType.isReadOnlyDueToUnknownValidator()) {
            editingInfo.setState(EditingInfo.State.UNAVAILABLE_CUSTOM_VALIDATION_PRESENT);
            throw new ForbiddenException(document);
        }

        final Node draft = EditingUtils.createDraft(workflow, handle).orElseThrow(() -> {
            // Apparently, holdership of a document has only just been acquired by another user. Check hints once more?
            editingInfo.setState(EditingInfo.State.UNAVAILABLE);
            return new ForbiddenException(document);
        });

        FieldTypeUtils.readFieldValues(draft, docType.getFields(), document.getFields());
        return document;
    }

    @Override
    public void updateDraft(final String uuid, final Document document, final Session session, final Locale locale)
            throws ErrorWithPayloadException {
        final Node handle = getHandle(uuid, session);
        final EditableWorkflow workflow = getWorkflow(handle);
        final Node draft = WorkflowUtils.getDocumentVariantNode(handle, WorkflowUtils.Variant.DRAFT)
                .orElseThrow(NotFoundException::new);

        if (!EditingUtils.canUpdateDocument(workflow)) {
            throw new ForbiddenException(new ErrorInfo(ErrorInfo.Reason.NOT_HOLDER));
        }

        final DocumentType docType = getDocumentType(handle, locale);
        if (docType.isReadOnlyDueToUnknownValidator()) {
            throw new ForbiddenException();
        }

        // Push fields onto draft node
        FieldTypeUtils.writeFieldValues(document.getFields(), docType.getFields(), draft);

        // Persist changes to repository
        try {
            session.save();
        } catch (RepositoryException e) {
            log.warn("Failed to save changes to draft node of document {}", uuid, e);
            throw new InternalServerErrorException();
        }

        if (!FieldTypeUtils.validateFieldValues(document.getFields(), docType.getFields())) {
            throw new BadRequestException(document);
        }

        copyToPreviewAndKeepEditing(session, workflow);
    }

    @Override
    public void deleteDraft(final String uuid, final Session session, final Locale locale)
            throws ErrorWithPayloadException {
        final Node handle = getHandle(uuid, session);
        final EditableWorkflow workflow = getWorkflow(handle);

        if (!EditingUtils.canDeleteDraft(workflow)) {
            throw new ForbiddenException(new ErrorInfo(ErrorInfo.Reason.ALREADY_DELETED));
        }

        try {
            workflow.disposeEditableInstance();
        } catch (WorkflowException | RepositoryException | RemoteException e) {
            log.warn("Failed to dispose of editable instance", e);
            throw new InternalServerErrorException();
        }
    }

    @Override
    public Document getPublished(final String uuid, final Session session, final Locale locale)
            throws ErrorWithPayloadException {
        final Node handle = getHandle(uuid, session);
        final EditableWorkflow workflow = getWorkflow(handle);
        final DocumentType docType = getDocumentType(handle, locale);
        final Document document = assembleDocument(uuid, handle, workflow, docType);

        WorkflowUtils.getDocumentVariantNode(handle, WorkflowUtils.Variant.PUBLISHED)
                .ifPresent(node -> FieldTypeUtils.readFieldValues(node, docType.getFields(), document.getFields()));
        return document;
    }

    private Node getHandle(final String uuid, final Session session) throws ErrorWithPayloadException {
        return DocumentUtils.getHandle(uuid, session)
                .filter(this::isValidHandle)
                .orElseThrow(NotFoundException::new);
    }

    private boolean isValidHandle(final Node handle) {
        return DocumentUtils.getVariantNodeType(handle)
                .filter(type -> !type.equals(HippoNodeType.NT_DELETED))
                .isPresent();
    }

    private EditableWorkflow getWorkflow(final Node handle) throws ErrorWithPayloadException {
        return WorkflowUtils.getWorkflow(handle, WORKFLOW_CATEGORY_EDIT, EditableWorkflow.class)
                .orElseThrow(() -> new MethodNotAllowed(new ErrorInfo(ErrorInfo.Reason.NOT_A_DOCUMENT)));
    }

    private DocumentType getDocumentType(final Node handle, final Locale locale)
            throws ErrorWithPayloadException {
        final String id = DocumentUtils.getVariantNodeType(handle).orElseThrow(InternalServerErrorException::new);

        try {
            return DocumentTypesService.get().getDocumentType(id, handle.getSession(), locale);
        } catch (RepositoryException e) {
            log.warn("Failed to retrieve JCR session for node '{}'", JcrUtils.getNodePathQuietly(handle), e);
            throw new InternalServerErrorException();
        } catch (ErrorWithPayloadException e) {
            log.debug("Failed to retrieve type of document '{}'", JcrUtils.getNodePathQuietly(handle), e);
            throw new InternalServerErrorException();
        }
    }

    private Document assembleDocument(final String uuid, final Node handle,
                                      final EditableWorkflow workflow, final DocumentType docType) {
        final Document document = new Document();
        document.setId(uuid);

        final DocumentInfo documentInfo = new DocumentInfo();
        documentInfo.setTypeId(docType.getId());
        document.setInfo(documentInfo);

        DocumentUtils.getDisplayName(handle).ifPresent(document::setDisplayName);

        final EditingInfo editingInfo = EditingUtils.determineEditingInfo(workflow, handle);
        documentInfo.setEditingInfo(editingInfo);

        return document;
    }

    private void copyToPreviewAndKeepEditing(final Session session, final EditableWorkflow workflow)
            throws ErrorWithPayloadException {
        try {
            workflow.commitEditableInstance();
        } catch (WorkflowException | RepositoryException | RemoteException e) {
            log.warn("Failed to persist changes", e);
            throw new InternalServerErrorException();
        }

        try {
            workflow.obtainEditableInstance();
        } catch (WorkflowException e) {
            log.warn("User '{}' failed to re-obtain ownership of document", session.getUserID(), e);
            throw new InternalServerErrorException(new ErrorInfo(ErrorInfo.Reason.HOLDERSHIP_LOST));
        } catch (RepositoryException | RemoteException e) {
            log.warn("User '{}' failed to re-obtain ownership of document", session.getUserID(), e);
            throw new InternalServerErrorException();
        }
    }
}
