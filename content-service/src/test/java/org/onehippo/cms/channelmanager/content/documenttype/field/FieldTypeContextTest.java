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

package org.onehippo.cms.channelmanager.content.documenttype.field;

import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import javax.jcr.Node;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.onehippo.cms.channelmanager.content.documenttype.ContentTypeContext;
import org.onehippo.cms.channelmanager.content.documenttype.SlimContentTypeContext;
import org.onehippo.cms.channelmanager.content.documenttype.util.NamespaceUtils;
import org.onehippo.cms7.services.contenttype.ContentType;
import org.onehippo.cms7.services.contenttype.ContentTypeItem;
import org.powermock.api.easymock.PowerMock;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import static org.easymock.EasyMock.createMock;
import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.replay;
import static org.easymock.EasyMock.verify;
import static org.hamcrest.CoreMatchers.equalTo;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.Assert.assertFalse;

@RunWith(PowerMockRunner.class)
@PrepareForTest({ContentTypeContext.class, NamespaceUtils.class})
public class FieldTypeContextTest {

    @Before
    public void setup() {
        PowerMock.mockStatic(ContentTypeContext.class);
        PowerMock.mockStatic(NamespaceUtils.class);
    }

    @Test
    public void createNoFieldProperty() {
        final Node editorFieldConfigNode = createMock(Node.class);
        final ContentTypeContext context = createMock(ContentTypeContext.class);

        expect(NamespaceUtils.getFieldProperty(editorFieldConfigNode)).andReturn(Optional.empty());

        PowerMock.replayAll();

        assertFalse(FieldTypeContext.create(editorFieldConfigNode, context).isPresent());

        PowerMock.verifyAll();
    }

    @Test
    public void createNoTypes() {
        final Node editorFieldConfigNode = createMock(Node.class);
        final ContentTypeContext context = createMock(ContentTypeContext.class);

        expect(NamespaceUtils.getFieldProperty(editorFieldConfigNode)).andReturn(Optional.of("fieldName"));

        expect(context.getTypesForFields()).andReturn(Collections.emptyList());

        PowerMock.replayAll();
        replay(context);

        assertFalse(FieldTypeContext.create(editorFieldConfigNode, context).isPresent());

        verify(context);
        PowerMock.verifyAll();
    }

    @Test
    public void createNoPath() {
        final Node editorFieldConfigNode = createMock(Node.class);
        final ContentTypeContext context = createMock(ContentTypeContext.class);
        final ContentType contentType = createMock(ContentType.class);
        final Node nodeTypeNode = createMock(Node.class);
        final SlimContentTypeContext type = new SlimContentTypeContext(contentType, nodeTypeNode);

        expect(NamespaceUtils.getFieldProperty(editorFieldConfigNode)).andReturn(Optional.of("fieldName"));
        expect(NamespaceUtils.getPathForNodeTypeField(nodeTypeNode, "fieldName")).andReturn(Optional.empty());

        expect(context.getTypesForFields()).andReturn(Collections.singletonList(type));

        PowerMock.replayAll();
        replay(context);

        assertFalse(FieldTypeContext.create(editorFieldConfigNode, context).isPresent());

        verify(context);
        PowerMock.verifyAll();
    }

    @Test
    public void createNoItem() {
        final Node editorFieldConfigNode = createMock(Node.class);
        final ContentTypeContext context = createMock(ContentTypeContext.class);
        final ContentType contentType = createMock(ContentType.class);
        final Node nodeTypeNode = createMock(Node.class);
        final SlimContentTypeContext type = new SlimContentTypeContext(contentType, nodeTypeNode);

        expect(NamespaceUtils.getFieldProperty(editorFieldConfigNode)).andReturn(Optional.of("fieldName"));
        expect(NamespaceUtils.getPathForNodeTypeField(nodeTypeNode, "fieldName")).andReturn(Optional.of("itemName"));

        expect(context.getTypesForFields()).andReturn(Collections.singletonList(type));
        expect(contentType.getItem("itemName")).andReturn(null);

        PowerMock.replayAll();
        replay(context, contentType);

        assertFalse(FieldTypeContext.create(editorFieldConfigNode, context).isPresent());

        verify(context, contentType);
        PowerMock.verifyAll();
    }

    @Test
    public void createContextFromPrimaryType() {
        final Node editorFieldConfigNode = createMock(Node.class);
        final ContentTypeContext context = createMock(ContentTypeContext.class);
        final ContentType contentType = createMock(ContentType.class);
        final Node nodeTypeNode = createMock(Node.class);
        final SlimContentTypeContext type = new SlimContentTypeContext(contentType, nodeTypeNode);
        final ContentTypeItem contentTypeItem = createMock(ContentTypeItem.class);

        expect(NamespaceUtils.getFieldProperty(editorFieldConfigNode)).andReturn(Optional.of("fieldName"));
        expect(NamespaceUtils.getPathForNodeTypeField(nodeTypeNode, "fieldName")).andReturn(Optional.of("itemName"));

        expect(context.getTypesForFields()).andReturn(Collections.singletonList(type));
        expect(contentType.getItem("itemName")).andReturn(contentTypeItem);

        PowerMock.replayAll();
        replay(context, contentType);

        final FieldTypeContext ftc = FieldTypeContext.create(editorFieldConfigNode, context).get();
        assertThat(ftc.getEditorConfigNode(), equalTo(Optional.of(editorFieldConfigNode)));
        assertThat(ftc.getParentContext(), equalTo(context));
        assertThat(ftc.getContentTypeItem(), equalTo(contentTypeItem));

        verify(context, contentType);
        PowerMock.verifyAll();
    }

    @Test
    public void createContextFromInheritedType() {
        final Node editorFieldConfigNode = createMock(Node.class);
        final ContentTypeContext context = createMock(ContentTypeContext.class);
        final ContentType contentType1 = createMock(ContentType.class);
        final ContentType contentType2 = createMock(ContentType.class);
        final Node nodeTypeNode1 = createMock(Node.class);
        final Node nodeTypeNode2 = createMock(Node.class);
        final SlimContentTypeContext type1 = new SlimContentTypeContext(contentType1, nodeTypeNode1);
        final SlimContentTypeContext type2 = new SlimContentTypeContext(contentType2, nodeTypeNode2);
        final ContentTypeItem contentTypeItem = createMock(ContentTypeItem.class);

        expect(NamespaceUtils.getFieldProperty(editorFieldConfigNode)).andReturn(Optional.of("fieldName"));
        expect(NamespaceUtils.getPathForNodeTypeField(nodeTypeNode1, "fieldName")).andReturn(Optional.empty());
        expect(NamespaceUtils.getPathForNodeTypeField(nodeTypeNode2, "fieldName")).andReturn(Optional.of("itemName"));

        expect(context.getTypesForFields()).andReturn(Arrays.asList(type1, type2));
        expect(contentType2.getItem("itemName")).andReturn(contentTypeItem);

        PowerMock.replayAll();
        replay(context, contentType2);

        final FieldTypeContext ftc = FieldTypeContext.create(editorFieldConfigNode, context).get();
        assertThat(ftc.getEditorConfigNode(), equalTo(Optional.of(editorFieldConfigNode)));
        assertThat(ftc.getParentContext(), equalTo(context));
        assertThat(ftc.getContentTypeItem(), equalTo(contentTypeItem));

        verify(context, contentType2);
        PowerMock.verifyAll();
    }

    @Test
    public void instantiateWithoutNode() {
        final ContentTypeItem contentTypeItem = createMock(ContentTypeItem.class);
        final ContentTypeContext parentContext = createMock(ContentTypeContext.class);

        final FieldTypeContext context = new FieldTypeContext(contentTypeItem, parentContext);

        assertFalse(context.getEditorConfigNode().isPresent());
        assertThat(context.getContentTypeItem(), equalTo(contentTypeItem));
        assertThat(context.getParentContext(), equalTo(parentContext));
    }

    @Test
    public void createContextForCompound() {
        final ContentTypeItem contentTypeItem = createMock(ContentTypeItem.class);
        final ContentTypeContext parentContext = createMock(ContentTypeContext.class);
        final ContentTypeContext childContext = createMock(ContentTypeContext.class);
        final FieldTypeContext context = new FieldTypeContext(contentTypeItem, parentContext);

        expect(contentTypeItem.getItemType()).andReturn("id");
        expect(ContentTypeContext.createFromParent("id", parentContext)).andReturn(Optional.of(childContext));

        PowerMock.replayAll();
        replay(contentTypeItem);

        assertThat(context.createContextForCompound().get(), equalTo(childContext));

        verify(contentTypeItem);
        PowerMock.verifyAll();
    }
}
