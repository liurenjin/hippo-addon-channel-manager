/*
 * Copyright 2011-2013 Hippo B.V. (http://www.onehippo.com)
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
package org.onehippo.cms7.channelmanager.templatecomposer.iframe;

import java.util.List;
import java.util.NoSuchElementException;

import com.gargoylesoftware.htmlunit.html.HtmlElement;

import org.junit.Before;
import org.junit.Test;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class CmsEditTest extends AbstractTemplateComposerTest {

    @Before
    public void startPage() throws Exception {
        setUp("cmseditlink.html");
        initializeIFrameHead();
        initializeTemplateComposer(false, true);
    }

    @Test
    public void testSurfAndEdit() throws Exception {
        assertFalse(isMessageSend("iframeexception"));

        // test if container is present
        HtmlElement link = getLink();
        assertTrue(isMessageSend("documents"));
        assertTrue(isMetaDataConsumed(link));
    }

    private HtmlElement getLink() {
        final List<HtmlElement> divs = page.getElementsByTagName("a");
        for (HtmlElement div : divs) {
            if (eval("HST.CLASS.EDITLINK").equals(div.getAttribute("class"))) {
                return div;
            }
        }
        throw new NoSuchElementException();
    }

    @Test
    public void clickLinkSendsMessage() throws Exception {
        HtmlElement link = getLink();
        link.click();

        final List<Message> messages = getMessagesSend();
        assertEquals("init", messages.get(0).messageTag);
        assertEquals("documents", messages.get(1).messageTag);
        assertEquals("edit-document", messages.get(2).messageTag);
        assertFalse(isMessageSend("iframeexception"));
    }

}
