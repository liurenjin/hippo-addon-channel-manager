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

import javax.jcr.Session;

import org.onehippo.cms.channelmanager.content.document.model.Document;
import org.onehippo.cms.channelmanager.content.error.ErrorWithPayloadException;

/**
 * DocumentsService exposes an API for reading and manipulating documents
 */
public interface DocumentsService {

    static DocumentsService get() {
        return DocumentsServiceImpl.getInstance();
    }

    /**
     * Creates a draft version of a document and locks it for editing by the current CMS user.
     *
     * If all goes well, the document's content is returned.
     *
     * @param uuid    UUID of the requested document (handle)
     * @param session user-authenticated, invocation-scoped JCR session
     * @return        JSON-serializable representation of the parts supported for exposing
     * @throws ErrorWithPayloadException
     *                If creation of the draft failed
     */
    Document createDraft(String uuid, Session session) throws ErrorWithPayloadException;

    /**
     * Update the draft version of a document, and keep it locked for further editing.
     *
     * @param uuid     UUID of the document to be updated
     * @param document Document containing the to-be-persisted content
     * @param session  user-authenticated, invocation-scoped JCR session.
     *                 In case of a bad request, changes may be pending.
     * @throws ErrorWithPayloadException
     *                 If updating the draft failed
     */
    void updateDraft(String uuid, Document document, Session session) throws ErrorWithPayloadException;

    /**
     * Delete the draft version of a document, such that it is available for others to edit.
     *
     * @param uuid    UUID of the document for which to delete the draft
     * @param session user-authenticated, invocation-scoped JCR session
     * @throws ErrorWithPayloadException
     *                If deleting the draft failed
     */
    void deleteDraft(String uuid, Session session) throws ErrorWithPayloadException;

    /**
     * Read the published variant of a document
     *
     * @param uuid    UUID of the requested document (handle)
     * @param session user-authenticated, invocation-scoped JCR session
     * @return        JSON-serializable representation of the parts supported for exposing
     * @throws ErrorWithPayloadException
     *                If retrieval of the live document failed
     */
    Document getPublished(String uuid, Session session) throws ErrorWithPayloadException;
}
