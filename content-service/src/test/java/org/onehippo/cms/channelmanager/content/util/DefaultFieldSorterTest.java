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

package org.onehippo.cms.channelmanager.content.util;

import java.util.List;
import java.util.NoSuchElementException;

import javax.jcr.Node;
import javax.jcr.Property;
import javax.jcr.RepositoryException;

import org.hippoecm.repository.api.HippoNodeType;
import org.junit.Test;
import org.onehippo.cms7.services.contenttype.ContentType;
import org.onehippo.cms7.services.contenttype.ContentTypeItem;
import org.onehippo.repository.mock.MockNode;

import static org.easymock.EasyMock.anyObject;
import static org.easymock.EasyMock.createMock;
import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.replay;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.MatcherAssert.assertThat;

public class DefaultFieldSorterTest {
    private final DefaultFieldSorter sorter = new DefaultFieldSorter();

    @Test
    public void sortFields() throws Exception {
        final ContentTypeContext context = createMock(ContentTypeContext.class);
        final ContentType type = createMock(ContentType.class);
        final ContentTypeItem item = createMock(ContentTypeItem.class);
        final Node root = MockNode.root();
        final Node contentTypeRoot = root.addNode("bla", "bla");
        final Node nodeType = contentTypeRoot.addNode(HippoNodeType.HIPPOSYSEDIT_NODETYPE, "bla")
                .addNode(HippoNodeType.HIPPOSYSEDIT_NODETYPE, "bla");
        final Node editorConfig = contentTypeRoot.addNode("editor:templates", "bla").addNode("_default_", "bla");
        editorConfig.addNode("no-field", "bla");
        final Node editorField1 = editorConfig.addNode("field1", "bla");
        editorConfig.addNode("field2", "bla");
        editorConfig.addNode("also-no-field", "bla");
        editorConfig.addNode("field3", "bla");

        nodeType.addNode("field1", "bla").setProperty(HippoNodeType.HIPPO_PATH, "path1");
        nodeType.addNode("field2", "bla").setProperty(HippoNodeType.HIPPO_PATH, "path2");
        nodeType.addNode("field3", "bla").setProperty(HippoNodeType.HIPPO_PATH, "path3");

        expect(context.getContentTypeRoot()).andReturn(contentTypeRoot);
        expect(context.getContentType()).andReturn(type).anyTimes();
        expect(type.getItem(anyObject())).andReturn(item).anyTimes();
        replay(context, type);

        final List<FieldTypeContext> fields = sorter.sortFields(context);

        assertThat(fields.size(), equalTo(3));
        assertThat(fields.get(0).getContentTypeItem(), equalTo(item));
        assertThat(fields.get(0).getEditorConfigNode(), equalTo(editorField1));
    }

    @Test
    public void sortFieldsWithRepositoryException() throws Exception {
        final ContentTypeContext context = createMock(ContentTypeContext.class);
        final ContentType contentType = createMock(ContentType.class);
        final Node contentRoot = createMock(Node.class);

        expect(context.getContentTypeRoot()).andReturn(contentRoot);
        expect(context.getContentType()).andReturn(contentType);
        expect(contentType.getName()).andReturn("bla");
        expect(contentRoot.getNode(NamespaceUtils.EDITOR_CONFIG_PATH)).andThrow(new RepositoryException());
        replay(context, contentType, contentRoot);

        final List<FieldTypeContext> fields = sorter.sortFields(context);

        assertThat(fields.size(), equalTo(0));
    }

    @Test(expected = NoSuchElementException.class)
    public void createFieldContextWithRepositoryException() throws Exception {
        final Node editorConfig = createMock(Node.class);

        expect(editorConfig.getName()).andThrow(new RepositoryException());
        replay(editorConfig);

        sorter.createFieldContext(editorConfig, null, null).get();
    }

    @Test(expected = NoSuchElementException.class)
    public void createFieldContextWithoutContentTypeItem() throws Exception {
        final Node editorConfig = createMock(Node.class);
        final Node nodeType = createMock(Node.class);
        final Node fieldType = createMock(Node.class);
        final Property pathProperty = createMock(Property.class);
        final ContentTypeContext context = createMock(ContentTypeContext.class);
        final ContentType contentType = createMock(ContentType.class);

        expect(editorConfig.getName()).andReturn("field");
        expect(nodeType.hasNode("field")).andReturn(true);
        expect(nodeType.getNode("field")).andReturn(fieldType);
        expect(fieldType.getProperty(HippoNodeType.HIPPO_PATH)).andReturn(pathProperty);
        expect(pathProperty.getString()).andReturn("path");
        expect(context.getContentType()).andReturn(contentType);
        expect(contentType.getItem("path")).andReturn(null);
        replay(editorConfig, nodeType, fieldType, pathProperty, context, contentType);

        sorter.createFieldContext(editorConfig, nodeType, context).get();
    }
}
