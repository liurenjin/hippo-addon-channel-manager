/*
 * Copyright 2016-2017 Hippo B.V. (http://www.onehippo.com)
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

package org.onehippo.cms.channelmanager.content.documenttype.field.type;

import javax.jcr.PropertyType;

import org.onehippo.cms.channelmanager.content.documenttype.field.FieldTypeContext;
import org.onehippo.cms.channelmanager.content.error.ErrorWithPayloadException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * StringFieldType controls the reading and writing of a String type field from and to a node's property.
 * <p>
 * The code diligently deals with the situation that the field type definition may be out of sync with the actual
 * property value, and exposes and validates a value as consistent as possible with the field type definition. As such,
 * a "no-change" read-and-write operation may have the effect that the document is adjusted towards better consistency
 * with the field type definition.
 */
public class StringFieldType extends PrimitiveFieldType {

    private static final Logger log = LoggerFactory.getLogger(AbstractFieldType.class);
    private static final String DEFAULT_VALUE = "";

    private Long maxLength;

    public StringFieldType() {
        setType(Type.STRING);
    }

    @Override
    public void init(final FieldTypeContext fieldContext) {
        super.init(fieldContext);
        initializeMaxLength(fieldContext);
    }

    void initializeMaxLength(final FieldTypeContext fieldContext) {
        fieldContext.getStringConfig("maxlength").ifPresent(this::setMaxLength);
    }

    void setMaxLength(final String maxLengthString) {
        try {
            maxLength = Long.valueOf(maxLengthString);
        } catch (final NumberFormatException e) {
            log.info("Failed to parser value of String's max length '{}'", maxLengthString, e);
        }
    }

    public Long getMaxLength() {
        return maxLength;
    }

    @Override
    protected int getPropertyType() {
        return PropertyType.STRING;
    }

    @Override
    protected String getDefault() {
        return DEFAULT_VALUE;
    }

    @Override
    protected void fieldSpecificValidations(final String validatedField) throws ErrorWithPayloadException {
        if (maxLength != null && validatedField.length() > maxLength) {
            throw INVALID_DATA.get();
        }
    }
}
