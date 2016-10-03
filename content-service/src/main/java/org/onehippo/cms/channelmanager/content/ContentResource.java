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

package org.onehippo.cms.channelmanager.content;

import java.util.Locale;

import javax.jcr.Session;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;

import org.onehippo.cms.channelmanager.content.exception.DocumentNotFoundException;
import org.onehippo.cms.channelmanager.content.exception.DocumentTypeNotFoundException;
import org.onehippo.cms.channelmanager.content.model.Document;
import org.onehippo.cms.channelmanager.content.model.DocumentTypeSpec;
import org.onehippo.cms.channelmanager.content.service.DocumentTypesService;
import org.onehippo.cms.channelmanager.content.service.DocumentsService;

@Produces("application/json")
@Path("/")
public class ContentResource {
    private final SessionDataProvider sessionDataProvider;

    public ContentResource(final SessionDataProvider userSessionProvider) {
        this.sessionDataProvider = userSessionProvider;
    }

    @GET
    @Path("documents/{id}")
    public Response getDocument(@PathParam("id") String id, @Context HttpServletRequest servletRequest) {
        final Session userSession = sessionDataProvider.getJcrSession(servletRequest);
        final DocumentsService documentsService = DocumentsService.get();
        try {
            final Document document = documentsService.getDocument(userSession, id);
            return Response.ok().entity(document).build();
        } catch (DocumentNotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    @GET
    @Path("documenttypes/{id}")
    public Response getDocumentTypeSpec(@PathParam("id") String id, @Context HttpServletRequest servletRequest) {
        final Session userSession = sessionDataProvider.getJcrSession(servletRequest);
        final Locale locale = sessionDataProvider.getLocale(servletRequest);
        final DocumentTypesService documentTypesService = DocumentTypesService.get();
        try {
            final DocumentTypeSpec docType = documentTypesService.getDocumentTypeSpec(id, userSession, locale);
            return Response.ok().entity(docType).build();
        } catch (DocumentTypeNotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }
}
