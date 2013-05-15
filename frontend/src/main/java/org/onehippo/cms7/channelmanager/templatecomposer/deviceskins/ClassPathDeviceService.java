/*
 *  Copyright 2013 Hippo B.V. (http://www.onehippo.com)
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
package org.onehippo.cms7.channelmanager.templatecomposer.deviceskins;

import java.io.IOException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.IOUtils;
import org.apache.wicket.Application;
import org.apache.wicket.Session;
import org.apache.wicket.resource.IPropertiesFactory;
import org.apache.wicket.resource.Properties;
import org.apache.wicket.util.resource.locator.ResourceNameIterator;
import org.hippoecm.frontend.plugin.IPluginContext;
import org.hippoecm.frontend.plugin.Plugin;
import org.hippoecm.frontend.plugin.config.IPluginConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Device service that loads device skins from the class path. Device IDs are defined in a
 * text file 'device-skins.txt', with one ID per line. The devices skins themselves are defined by
 * a resource bundle in the package org.onehippo.cms7.channelmanager.templatecomposer.deviceskins.devices,
 * each named <device id>.properties.
 */
public class ClassPathDeviceService extends Plugin implements DeviceService  {

    private static Logger log = LoggerFactory.getLogger(ClassPathDeviceService.class);

    protected final Map<String, DeviceSkin> deviceSkins = new LinkedHashMap<String, DeviceSkin>();

    /**
     * Construct a new Plugin.
     *
     * @param context the plugin context
     * @param config  the plugin config
     */
    public ClassPathDeviceService(IPluginContext context, IPluginConfig config) {
        super(context, config);

        if (config != null && config.getString("deviceskins.service.id") != null) {
            context.registerService(this, config.getString("deviceskins.service.id"));
        }

        loadDeviceSkinsFromClasspath();
    }

    private void loadDeviceSkinsFromClasspath() {
        try {
            final ClassLoader classLoader = getClass().getClassLoader();
            String pathToClass = getClass().getPackage().getName().replace('.', '/');
            final Enumeration<URL> resources = classLoader.getResources(pathToClass + "/devices/device-skins.txt");
            while (resources.hasMoreElements()) {
                URL indexURL = resources.nextElement();
                final List<String> list = IOUtils.readLines(indexURL.openStream());
                for (String entry : list) {
                    String id = entry.trim();
                    if (deviceSkins.containsKey(id)) {
                        continue;
                    }

                    loadDeviceSkin(id, indexURL);
                }
            }
        } catch (IOException e) {
            log.error("Unable to load device skins from classpath", e);
        }
    }

    private void loadDeviceSkin(final String id, final URL indexURL) {
        final IPropertiesFactory propertiesFactory = Application.get().getResourceSettings().getPropertiesFactory();
        ResourceNameIterator rni = new ResourceNameIterator("devices/" + id + ".", null, Session.get().getLocale(), null);
        Properties properties;
        while (rni.hasNext()) {
            final String path = rni.next();
            String pathToClass = getClass().getPackage().getName().replace('.', '/');
            properties = propertiesFactory.load(getClass(), pathToClass + '/' + path);
            if (properties != null) {
                log.debug("Loading device skin '" + id + "' defined in " + indexURL);
                deviceSkins.put(id, new DeviceSkinImpl(id, properties));
                return;
            }
        }
        log.warn("Cannot find device skin '" + id + "' defined in " + indexURL + ", skipping this skin");
    }

    @Override
    public List<DeviceSkin> getDeviceSkins() {
        return new ArrayList<DeviceSkin>(deviceSkins.values());
    }

}
