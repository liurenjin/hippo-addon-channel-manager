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

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import javax.jcr.Node;

import org.onehippo.cms.channelmanager.content.document.model.FieldValue;
import org.onehippo.cms.channelmanager.content.documenttype.ContentTypeContext;
import org.onehippo.cms.channelmanager.content.documenttype.field.sort.FieldSorter;
import org.onehippo.cms.channelmanager.content.documenttype.field.type.ChoiceFieldType;
import org.onehippo.cms.channelmanager.content.documenttype.field.type.ChoiceFieldUtils;
import org.onehippo.cms.channelmanager.content.documenttype.field.type.CompoundFieldType;
import org.onehippo.cms.channelmanager.content.documenttype.model.DocumentType;
import org.onehippo.cms.channelmanager.content.documenttype.field.type.FieldType;
import org.onehippo.cms.channelmanager.content.documenttype.field.type.MultilineStringFieldType;
import org.onehippo.cms.channelmanager.content.documenttype.field.type.StringFieldType;
import org.onehippo.cms.channelmanager.content.documenttype.util.NamespaceUtils;
import org.onehippo.cms.channelmanager.content.error.ErrorWithPayloadException;
import org.onehippo.cms7.services.contenttype.ContentTypeItem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * FieldTypeUtils provides utility methods for populating and dealing with field types.
 */
public class FieldTypeUtils {
    private static final Logger log = LoggerFactory.getLogger(FieldTypeUtils.class);
    private static final String FIELD_TYPE_COMPOUND = "Compound";
    private static final String FIELD_TYPE_CHOICE = "Choice";
    private static final String PROPERTY_FIELD_PLUGIN = "org.hippoecm.frontend.editor.plugins.field.PropertyFieldPlugin";
    private static final String NODE_FIELD_PLUGIN = "org.hippoecm.frontend.editor.plugins.field.NodeFieldPlugin";
    private static final String CONTENT_BLOCKS_PLUGIN = "org.onehippo.forge.contentblocks.ContentBlocksFieldPlugin";

    // Known non-validating validator values
    private static final Set<String> IGNORED_VALIDATORS;

    // Translate JCR level validator to FieldType.Validator
    private static final Map<String, FieldType.Validator> VALIDATOR_MAP;

    // Unsupported validators of which we know they have field-scope only
    private static final Set<String> FIELD_VALIDATOR_WHITELIST;

    // A map for associating supported JCR-level field types with relevant information
    public static final Map<String, TypeDescriptor> FIELD_TYPE_MAP;

    static {
        IGNORED_VALIDATORS = new HashSet<>();
        IGNORED_VALIDATORS.add(FieldValidators.OPTIONAL); // optional "validator" indicates that the field may be absent (cardinality).

        VALIDATOR_MAP = new HashMap<>();
        VALIDATOR_MAP.put(FieldValidators.REQUIRED, FieldType.Validator.REQUIRED);
        VALIDATOR_MAP.put(FieldValidators.NON_EMPTY, FieldType.Validator.REQUIRED);
        // Apparently, making a String field required puts above two(!) values onto the validator property.

        FIELD_VALIDATOR_WHITELIST = new HashSet<>();
        FIELD_VALIDATOR_WHITELIST.add(FieldValidators.EMAIL);
        FIELD_VALIDATOR_WHITELIST.add(FieldValidators.ESCAPED);
        FIELD_VALIDATOR_WHITELIST.add(FieldValidators.HTML);
        FIELD_VALIDATOR_WHITELIST.add(FieldValidators.IMAGE_REFERENCES);
        FIELD_VALIDATOR_WHITELIST.add(FieldValidators.REFERENCES);
        FIELD_VALIDATOR_WHITELIST.add(FieldValidators.REQUIRED);
        FIELD_VALIDATOR_WHITELIST.add(FieldValidators.RESOURCE_REQUIRED);

        FIELD_TYPE_MAP = new HashMap<>();
        FIELD_TYPE_MAP.put("String", new TypeDescriptor(StringFieldType.class, PROPERTY_FIELD_PLUGIN));
        FIELD_TYPE_MAP.put("Text", new TypeDescriptor(MultilineStringFieldType.class, PROPERTY_FIELD_PLUGIN));
        FIELD_TYPE_MAP.put(FIELD_TYPE_COMPOUND, new TypeDescriptor(CompoundFieldType.class, NODE_FIELD_PLUGIN));
        FIELD_TYPE_MAP.put(FIELD_TYPE_CHOICE, new TypeDescriptor(ChoiceFieldType.class, CONTENT_BLOCKS_PLUGIN));
    }

    private static class TypeDescriptor {
        public final Class<? extends FieldType> fieldTypeClass;
        public final String defaultPluginClass;

        public TypeDescriptor(final Class<? extends FieldType> fieldTypeClass, final String defaultPluginClass) {
            this.fieldTypeClass = fieldTypeClass;
            this.defaultPluginClass = defaultPluginClass;
        }
    }

    /**
     * Translate the set of validators specified at JCR level into a set of validators at the {@link FieldType} level.
     * When the list of validators contains an unknown one, the document type is marked as 'readonly due to
     * unknown validator'.
     *
     * @param fieldType  Specification of a field type
     * @param docType The document type the field is a part of
     * @param validators List of 0 or more validators specified at JCR level
     */
    public static void determineValidators(final FieldType fieldType, final DocumentType docType, final List<String> validators) {
        for (String validator : validators) {
            if (IGNORED_VALIDATORS.contains(validator)) {
                // Do nothing
            } else if (VALIDATOR_MAP.containsKey(validator)) {
                fieldType.addValidator(VALIDATOR_MAP.get(validator));
            } else if (FIELD_VALIDATOR_WHITELIST.contains(validator)) {
                fieldType.addValidator(FieldType.Validator.UNSUPPORTED);
            } else {
                docType.setReadOnlyDueToUnknownValidator(true);
            }
        }
    }

    /**
     * Populate the list of fields of a content type, in the context of assembling a Document Type
     *
     * @param fields      list of fields to populate
     * @param context     determines which fields are available
     */
    public static void populateFields(final List<FieldType> fields, final ContentTypeContext context) {
        NamespaceUtils.retrieveFieldSorter(context.getContentTypeRoot())
                .ifPresent(sorter -> sortValidateAndAddFields(sorter, context, fields));
    }

    private static void sortValidateAndAddFields(final FieldSorter sorter, final ContentTypeContext context,
                                                 final List<FieldType> fields) {
        sorter.sortFields(context)
                .stream()
                .forEach(field -> validateCreateAndInit(field).ifPresent(fields::add));
    }

    private static Optional<FieldType> validateCreateAndInit(final FieldTypeContext context) {
        return determineDescriptor(context)
                .filter(descriptor -> usesDefaultFieldPlugin(context, descriptor))
                .flatMap(descriptor -> FieldTypeFactory.createFieldType(descriptor.fieldTypeClass))
                .map(fieldType -> {
                    fieldType.init(context);
                    return fieldType.isValid() ? fieldType : null;
                });
    }

    private static Optional<TypeDescriptor> determineDescriptor(final FieldTypeContext context) {
        return Optional.ofNullable(FIELD_TYPE_MAP.get(determineFieldType(context)));
    }

    private static String determineFieldType(final FieldTypeContext context) {
        final ContentTypeItem item = context.getContentTypeItem();
        if (item.isProperty()) {
            return item.getItemType();
        }

        return ChoiceFieldUtils.isChoiceField(context) ? FIELD_TYPE_CHOICE : FIELD_TYPE_COMPOUND;
    }

    private static boolean usesDefaultFieldPlugin(final FieldTypeContext context, final TypeDescriptor descriptor) {
        return determinePluginClass(context)
                .filter(descriptor.defaultPluginClass::equals)
                .isPresent();
    }

    private static Optional<String> determinePluginClass(final FieldTypeContext context) {
        return context.getEditorConfigNode()
                .flatMap(NamespaceUtils::getPluginClassForField);
    }


    /**
     * Try to read a list of fields from a node into a map of values.
     *
     * @param node     JCR node to read from
     * @param fields   fields to read
     * @param valueMap map of values to populate
     */
    public static void readFieldValues(final Node node,
                                       final List<FieldType> fields,
                                       final Map<String, List<FieldValue>> valueMap) {
        for (FieldType field : fields) {
            field.readFrom(node).ifPresent(values -> valueMap.put(field.getId(), values));
        }
    }

    /**
     * Write the values of a set of fields to a (JCR) node, facilitated by a list of field types.
     *
     * Values not defined in the list of field types are ignored.
     *
     * @param valueMap set of field type ID -> list of field values mappings. Values are not checked yet.
     * @param fields   set of field type definitions, specifying how to interpret the corresponding field values
     * @param node     the JCR node to write the field values to.
     * @throws ErrorWithPayloadException
     *                 if fieldType#writeTo() bumps into an error.
     */
    public static void writeFieldValues(final Map<String, List<FieldValue>> valueMap,
                                        final List<FieldType> fields,
                                        final Node node) throws ErrorWithPayloadException {
        for (FieldType fieldType : fields) {
            if (!fieldType.hasUnsupportedValidator()) {
                fieldType.writeTo(node, Optional.ofNullable(valueMap.get(fieldType.getId())));
            }
        }
    }

    /**
     * Validate the values of a set of fields against a list of field types.
     *
     * Values not defined in the list of field types are ignored.
     *
     * @param valueMap set of field type ID -> to be validated list of field values mappings
     * @param fields   set of field type definitions, including the applicable validators
     * @return         true if all checked field values are valid, false otherwise.
     */
    public static boolean validateFieldValues(final Map<String, List<FieldValue>> valueMap, final List<FieldType> fields) {
        boolean isValid = true;

        for (FieldType fieldType : fields) {
            final String fieldId = fieldType.getId();
            if (valueMap.containsKey(fieldId)) {
                if (!fieldType.validate(valueMap.get(fieldId))) {
                    isValid = false;
                }
            }
        }

        return isValid;
    }
}
