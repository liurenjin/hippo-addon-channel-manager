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

import java.util.Locale;

import javax.jcr.Node;
import javax.jcr.Property;
import javax.jcr.RepositoryException;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.onehippo.cms7.services.HippoServiceRegistry;
import org.onehippo.repository.l10n.LocalizationService;
import org.onehippo.repository.l10n.ResourceBundle;
import org.powermock.api.easymock.PowerMock;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import static org.easymock.EasyMock.createMock;
import static org.easymock.EasyMock.expect;
import static org.easymock.EasyMock.replay;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

@RunWith(PowerMockRunner.class)
@PrepareForTest({HippoServiceRegistry.class, NamespaceUtils.class})
public class LocalizationUtilsTest {

    @Test
    public void getResourceBundle() {
        final Locale locale = new Locale("en");
        final LocalizationService localizationService = createMock(LocalizationService.class);
        final ResourceBundle resourceBundle = createMock(ResourceBundle.class);
        PowerMock.mockStaticPartial(HippoServiceRegistry.class, "getService");

        expect(localizationService.getResourceBundle("hippo:types.ns:testdocument", locale)).andReturn(resourceBundle);
        replay(localizationService);
        expect(HippoServiceRegistry.getService(LocalizationService.class)).andReturn(localizationService);
        PowerMock.replayAll();

        assertThat(LocalizationUtils.getResourceBundleForDocument("ns:testdocument", locale), equalTo(resourceBundle));
    }

    @Test
    public void getResourceBundleNull() {
        final Locale locale = new Locale("en");
        final LocalizationService localizationService = createMock(LocalizationService.class);
        PowerMock.mockStaticPartial(HippoServiceRegistry.class, "getService");

        expect(localizationService.getResourceBundle("hippo:types.ns:testdocument", locale)).andReturn(null);
        replay(localizationService);
        expect(HippoServiceRegistry.getService(LocalizationService.class)).andReturn(localizationService);
        PowerMock.replayAll();

        assertThat(LocalizationUtils.getResourceBundleForDocument("ns:testdocument", locale), equalTo(null));
    }

    @Test
    public void getLocalizedDocumentDisplayName() {
        final String displayName = "displayName";
        final ResourceBundle resourceBundle = createMock(ResourceBundle.class);

        expect(resourceBundle.getString("jcr:name")).andReturn(displayName);
        replay(resourceBundle);

        assertThat(LocalizationUtils.determineDocumentDisplayName("anything", resourceBundle), equalTo(displayName));
    }

    @Test
    public void getIdBasedDocumentDisplayName() {
        final String displayName = "displayName";
        final String id = "namespace:" + displayName;
        final ResourceBundle resourceBundle = createMock(ResourceBundle.class);

        expect(resourceBundle.getString("jcr:name")).andReturn(null);
        replay(resourceBundle);

        assertThat(LocalizationUtils.determineDocumentDisplayName(id, resourceBundle), equalTo(displayName));
    }

    @Test
    public void getDocumentDisplayNameWithoutResourceBundle() {
        final String displayName = "displayName";
        final String id = "namespace:" + displayName;

        assertThat(LocalizationUtils.determineDocumentDisplayName(id, null), equalTo(displayName));
    }

    @Test
    public void failToGetDocumentDisplayName() {
        final ResourceBundle resourceBundle = createMock(ResourceBundle.class);

        expect(resourceBundle.getString("jcr:name")).andReturn(null);
        replay(resourceBundle);

        assertThat(LocalizationUtils.determineDocumentDisplayName("anything", resourceBundle), equalTo(null));
    }

    @Test
    public void getLocalizedFieldDisplayName() {
        final String displayName = "displayName";
        final ResourceBundle resourceBundle = createMock(ResourceBundle.class);

        expect(resourceBundle.getString("ns:title")).andReturn(displayName);
        replay(resourceBundle);

        assertThat(LocalizationUtils.determineFieldDisplayName("ns:title", resourceBundle, null), equalTo(displayName));
    }

    @Test
    public void getConfigBasedFieldDisplayName() throws Exception {
        final String displayName = "displayName";
        final Node root = createMock(Node.class);
        final Node config = createMock(Node.class);
        final Property property = createMock(Property.class);
        final ResourceBundle resourceBundle = createMock(ResourceBundle.class);
        PowerMock.mockStaticPartial(NamespaceUtils.class, "getConfigForField");

        expect(resourceBundle.getString("ns:title")).andReturn(null);
        expect(config.getProperty("caption")).andReturn(property);
        expect(property.getString()).andReturn(displayName);
        replay(resourceBundle, config, property);
        expect(NamespaceUtils.getConfigForField(root, "ns:title")).andReturn(config);
        PowerMock.replayAll();

        assertThat(LocalizationUtils.determineFieldDisplayName("ns:title", resourceBundle, root), equalTo(displayName));
    }

    @Test
    public void getConfigBasedFieldDisplayNameWithRepositoryException() throws Exception {
        final Node root = createMock(Node.class);
        final Node config = createMock(Node.class);
        PowerMock.mockStaticPartial(NamespaceUtils.class, "getConfigForField");

        expect(config.getProperty("caption")).andThrow(new RepositoryException());
        replay(config);
        expect(NamespaceUtils.getConfigForField(root, "ns:title")).andReturn(config);
        PowerMock.replayAll();

        assertThat(LocalizationUtils.determineFieldDisplayName("ns:title", null, root), equalTo(null));
    }

    @Test
    public void getConfigBasedFieldDisplayNameAndFail() throws Exception {
        final Node root = createMock(Node.class);
        PowerMock.mockStaticPartial(NamespaceUtils.class, "getConfigForField");

        expect(NamespaceUtils.getConfigForField(root, "ns:title")).andReturn(null);
        PowerMock.replayAll();

        assertThat(LocalizationUtils.determineFieldDisplayName("ns:title", null, root), equalTo(null));
    }

    @Test
    public void getLocalizedHint() {
        final String hint = "hint";
        final ResourceBundle resourceBundle = createMock(ResourceBundle.class);

        expect(resourceBundle.getString("ns:title#hint")).andReturn(hint);
        replay(resourceBundle);

        assertThat(LocalizationUtils.determineFieldHint("ns:title", resourceBundle, null), equalTo(hint));
    }

    @Test
    public void getConfigBasedHint() throws Exception {
        final String hint = "hint";
        final Node root = createMock(Node.class);
        final Node config = createMock(Node.class);
        final Property property = createMock(Property.class);
        PowerMock.mockStaticPartial(NamespaceUtils.class, "getConfigForField");

        expect(config.getProperty("hint")).andReturn(property);
        expect(property.getString()).andReturn(hint);
        replay(config, property);
        expect(NamespaceUtils.getConfigForField(root, "ns:title")).andReturn(config);
        PowerMock.replayAll();

        assertThat(LocalizationUtils.determineFieldHint("ns:title", null, root), equalTo(hint));
    }
}