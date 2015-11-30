/*
 *  Copyright 2011-2015 Hippo B.V. (http://www.onehippo.com)
 * 
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 * 
 *       http://www.apache.org/licenses/LICENSE-2.0
 * 
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package org.onehippo.cms7.channelmanager.templatecomposer.iframe;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ResourceBundle;

import com.gargoylesoftware.htmlunit.html.DomElement;
import com.gargoylesoftware.htmlunit.html.DomNode;
import com.gargoylesoftware.htmlunit.javascript.host.Node;
import com.gargoylesoftware.htmlunit.javascript.host.Window;
import com.google.gson.Gson;

import org.hippoecm.frontend.HippoHeaderItem;
import org.hippoecm.frontend.extjs.ExtUtilsHeaderItem;
import org.onehippo.cms7.channelmanager.AbstractJavascriptTest;
import org.onehippo.cms7.channelmanager.ResourceServlet;
import org.onehippo.cms7.channelmanager.templatecomposer.PageEditor;
import org.onehippo.cms7.channelmanager.templatecomposer.TemplateComposerApiHeaderItem;
import org.onehippo.cms7.channelmanager.templatecomposer.TemplateComposerGlobalBundle;
import org.onehippo.cms7.jquery.JQueryBundle;
import org.wicketstuff.js.ext.ExtBundle;

import net.sourceforge.htmlunit.corejs.javascript.BaseFunction;
import net.sourceforge.htmlunit.corejs.javascript.Function;
import net.sourceforge.htmlunit.corejs.javascript.Scriptable;
import net.sourceforge.htmlunit.corejs.javascript.ScriptableObject;

abstract public class AbstractTemplateComposerTest extends AbstractJavascriptTest {

    public class Message {

        public String tag;
        public Object payload;

        public Message(final String tag, final Object payload) {
            this.tag = tag;
            this.payload = payload;
        }

        public String toString() {
            return tag;
        }

    }

    protected List<Message> hostToIFrameMessages = new ArrayList<>();
    protected List<Message> iframeToHostMessages = new ArrayList<>();

    @Override
    public void setUp(String name) throws Exception {
        super.setUp(name);
        initializeIFrameHead();
    }

    protected boolean isMetaDataConsumed(final DomElement containerDiv) {
        boolean metaDataConsumed = true;
        DomNode tmp = containerDiv;
        while ((tmp = tmp.getPreviousSibling()) != null) {
            if (tmp.getNodeType() == Node.COMMENT_NODE) {
                metaDataConsumed = false;
            }
        }
        return metaDataConsumed;
    }

    protected void initializeIFrameHead() throws IOException {
        injectJavascript(ExtBundle.class, ExtBundle.EXT_BASE_DEBUG);
        injectJavascript(ExtBundle.class, ExtBundle.EXT_ALL_DEBUG);
        injectJavascript(HippoHeaderItem.class, "js/message-bus.js");
        injectJavascript(ResourceServlet.class, "mockHippoUserActivity.js");
        injectJavascript(ExtUtilsHeaderItem.class, "IFramePanel.js");
        injectJavascript(TemplateComposerApiHeaderItem.class, "IFramePanel.js");
        injectJavascript(InitializationTest.class, "mockIFramePanel.js");

        Window window = (Window) page.getWebClient().getCurrentWindow().getScriptObject();
        ScriptableObject instance = getScriptableObject(window, "Hippo.MockedPageEditorIFramePanel");
        ScriptableObject hostToIFrame = (ScriptableObject) instance.get("hostToIFrame");
        ScriptableObject iframeToHost = (ScriptableObject) instance.get("iframeToHost");
        interceptMessages(hostToIFrame, hostToIFrameMessages);
        interceptMessages(iframeToHost, iframeToHostMessages);

        injectJavascript(JQueryBundle.class, JQueryBundle.JQUERY_CORE);
        injectJavascript(JQueryBundle.class, JQueryBundle.JQUERY_CLASS_PLUGIN);
        injectJavascript(JQueryBundle.class, JQueryBundle.JQUERY_NAMESPACE_PLUGIN);
        injectJavascript(JQueryBundle.class, JQueryBundle.JQUERY_UI);

        injectJavascript(TemplateComposerGlobalBundle.class, TemplateComposerGlobalBundle.GLOBALS);
        injectJavascript(IFrameBundle.class, IFrameBundle.UTIL);
        injectJavascript(IFrameBundle.class, IFrameBundle.DRAG_DROP);
        injectJavascript(IFrameBundle.class, IFrameBundle.FACTORY);
        injectJavascript(IFrameBundle.class, IFrameBundle.PAGE);
        injectJavascript(IFrameBundle.class, IFrameBundle.WIDGETS);
        injectJavascript(IFrameBundle.class, IFrameBundle.SURFANDEDIT);
        injectJavascript(IFrameBundle.class, IFrameBundle.LAST);
    }

    private ScriptableObject getScriptableObject(Window window, String namespacedName) {
        ScriptableObject object = window;
        for (String namespacePart : namespacedName.split("\\.")) {
            object = (ScriptableObject) object.get(namespacePart);
        }
        return object;
    }

    private void interceptMessages(final ScriptableObject messageBus, final List<Message> interceptedMessages) {
        final Function oldFunction = (Function) messageBus.get("publish");
        ScriptableObject.putProperty(messageBus, "publish", new BaseFunction() {
            @Override
            public Object call(final net.sourceforge.htmlunit.corejs.javascript.Context cx, final Scriptable scope, final Scriptable thisObj, final Object[] args) {
                String tag = (String) args[0];
                Object payload = args.length > 1 ? args[1] : null;
                interceptedMessages.add(new Message(tag, payload));
                return oldFunction.call(cx, scope, thisObj, args);
            }
        });
    }

    protected void initializeTemplateComposer(final boolean debug, final boolean previewMode) {
        ResourceBundle resourceBundle = ResourceBundle.getBundle(PageEditor.class.getName());
        final Map<String, String> resourcesMap = new HashMap<>();
        for (String key : resourceBundle.keySet()) {
            resourcesMap.put(key, resourceBundle.getString(key));
        }

        Map<String, Object> argument = new HashMap<>();
        argument.put("debug", debug);
        argument.put("previewMode", previewMode);
        argument.put("resources", resourcesMap);

        Gson gson = new Gson();
        String message = gson.toJson(argument);

        page.executeJavaScript("Ext.getCmp('pageEditorIFrame').hostToIFrame.publish('init', " + message + ");");
    }

    protected static boolean isPublished(List<Message> messages, String message) {
        for (Message messageObject : messages) {
            if (message.equals(messageObject.tag)) {
                return true;
            }
        }
        return false;
    }

}
