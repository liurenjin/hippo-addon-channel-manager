/*
 * Copyright 2013 Hippo B.V. (http://www.onehippo.com)
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
package org.onehippo.cms7.channelmanager.templatecomposer.deviceskins;

import java.util.MissingResourceException;
import java.util.ResourceBundle;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class TypedResourceBundle {

    private static final Logger log = LoggerFactory.getLogger(TypedResourceBundle.class);

    private final ResourceBundle bundle;
    private final String logName;

    public TypedResourceBundle(final ResourceBundle bundle, final String logName) {
        this.bundle = bundle;
        this.logName = logName;
    }

    private void logMissingProperty(String name, String defaultValue) {
        log.warn(logName + " does not specify '" + name + "'. Using '" + defaultValue + "' instead.");
    }

    Set<String> keySet() {
        return bundle.keySet();
    }

    String getString(final String name, final String defaultValue) {
        try {
            return bundle.getString(name);
        } catch (MissingResourceException e) {
            logMissingProperty(name, defaultValue);
        }
        return defaultValue;
    }

    int getInteger(final String name, final int defaultValue) {
        String value = null;
        try {
            value = bundle.getString(name);
            return Integer.parseInt(value);
        } catch (MissingResourceException e) {
            logMissingProperty(name, String.valueOf(defaultValue));
        } catch (NumberFormatException e) {
            log.warn(logName + " has an illegal value for '" + name
                    + "'. Expected an integer, but got '" + value
                    + "'. Using '" + defaultValue + "' instead.");
        }
        return defaultValue;
    }

    double getDouble(final String name, final double defaultValue) {
        String value = null;
        try {
            value = bundle.getString(name);
            return Double.parseDouble(value);
        } catch (MissingResourceException e) {
            logMissingProperty(name, String.valueOf(defaultValue));
        } catch (NumberFormatException e) {
            log.warn(logName + " has an illegal value for '" + name
                    + "'. Expected a double, but got '" + value
                    + "'. Using '" + defaultValue + "' instead.");
        }
        return defaultValue;
    }

}
