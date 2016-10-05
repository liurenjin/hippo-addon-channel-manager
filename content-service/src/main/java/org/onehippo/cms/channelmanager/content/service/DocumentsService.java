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

import javax.jcr.Session;

import org.onehippo.cms.channelmanager.content.exception.DocumentNotFoundException;
import org.onehippo.cms.channelmanager.content.model.Document;

/**
 * DocumentsService exposes an API for reading and manipulating documents
 */
public interface DocumentsService {

    static DocumentsService get() {
        return DocumentsServiceImpl.getInstance();
    }

    /**
     * Read the contents and state of a document into a JSON-serializable representation
     *
     * @param session user-authenticated JCR session for reading from the repository
     * @param id      UUID of the requested document (handle)
     * @return        JSON-serializable representation of the parts supported for exposing
     * @throws DocumentNotFoundException
     *                If the requested UUID was not found or is not a document
     */
    Document getDocument(final Session session, final String id) throws DocumentNotFoundException;
}