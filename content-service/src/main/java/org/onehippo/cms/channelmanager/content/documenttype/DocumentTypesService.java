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

import javax.jcr.Session;

import org.onehippo.cms.channelmanager.content.error.ErrorWithPayloadException;
import org.onehippo.cms.channelmanager.content.documenttype.model.DocumentType;

/**
 * DocumentTypesService exposes an API for reading document types
 */
public interface DocumentTypesService {

    static DocumentTypesService get() {
        return DocumentTypesServiceImpl.getInstance();
    }

    /**
     * Read the supported part of a document type into a JSON-serializable representation
     *
     * @param id      ID of the document type, e.g. "myhippoproject:newsdocument"
     * @param userSession user-authenticated, invocation-scoped JCR session for read-only access
     * @param locale  locale of the current CMS session
     * @return        JSON-serializable representation of the parts supported for exposing
     * @throws ErrorWithPayloadException
     *                if assembling the document type specification failed in a non-recoverable manner
     */
    DocumentType getDocumentType(String id, Session userSession, Locale locale)
            throws ErrorWithPayloadException;

    /**
     * Invalidate the document type cache
     */
    void invalidateCache();
}
