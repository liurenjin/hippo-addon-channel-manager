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

package org.onehippo.cms.channelmanager.content.model.documenttype;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import javax.jcr.Node;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;

import org.onehippo.cms.channelmanager.content.util.ContentTypeContext;
import org.onehippo.cms.channelmanager.content.util.FieldTypeContext;
import org.onehippo.cms.channelmanager.content.util.FieldTypeUtils;
import org.onehippo.cms.channelmanager.content.util.FieldValidators;
import org.onehippo.cms.channelmanager.content.util.LocalizationUtils;
import org.onehippo.cms7.services.contenttype.ContentTypeItem;
import org.onehippo.repository.l10n.ResourceBundle;

/**
 * This bean represents a field type, used for the fields of a {@link DocumentType}.
 * It can be serialized into JSON to expose it through a REST API.
 */
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class FieldType {

    private String id;            // "namespace:fieldname", unique within a "level" of fields.
    private Type type;
    private String displayName;   // using the correct language/locale
    private String hint;          // using the correct language/locale

    private Boolean multiple;     // Boolean (i.s.o. boolean) removes the 'false' value from JSON output
    // private boolean orderable; // future improvement
    // private boolean readOnly;  // future improvement

    private Set<Validator> validators;

    // TODO: move up into CompoundFieldType? - currently not possible due to deserialization in MockResponse.
    protected List<FieldType> fields; // the child-fields of a complex field type (COMPOUND or CHOICE)

    public enum Type {
        STRING,
        MULTILINE_STRING,
        CHOICE, // "content blocks"
        COMPOUND
    }

    /**
     *  The 'REQUIRED' validator is meant to indicate that a primitive field must have content. What exactly that
     *  means depends on the field type. The 'REQUIRED' validator is *not* meant to indicate that at least one
     *  instance of a multiple field must be present.
     */
    public enum Validator {
        REQUIRED,
        UNSUPPORTED
    }

    public FieldType() {
    }

    public String getId() {
        return id;
    }

    public void setId(final String id) {
        this.id = id;
    }

    public Type getType() {
        return type;
    }

    protected void setType(final Type type) {
        this.type = type;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(final String displayName) {
        this.displayName = displayName;
    }

    public String getHint() {
        return hint;
    }

    public void setHint(final String hint) {
        this.hint = hint;
    }

    public Boolean isMultiple() {
        return multiple;
    }

    public void setMultiple(final boolean multiple) {
        this.multiple = multiple;
    }

    public Set<Validator> getValidators() {
        return validators;
    }

    public void addValidator(final Validator validator) {
        if (validators == null) {
            validators = new HashSet<>();
        }
        validators.add(validator);
    }

    public List<FieldType> getFields() {
        return fields;
    }

    public void setFields(final List<FieldType> fields) {
        this.fields = fields;
    }

    // TODO: once we phase out the ns:testdocument, this method and class should be made abstract.
    /**
     * Read a document field instance from a document variant node
     *
     * @param node JCR node to read th value from
     * @return     Object representing the value, or nothing, wrapped in an Optional
     */
    public Optional<Object> readFrom(Node node) {
        return Optional.empty();
    }

    /**
     * Initialize a FieldType, given various information sources:
     *
     * @param context            field-specific information
     * @param contentTypeContext content type-specific information (may be document of compound)
     * @param docType            reference to the document type being assembled
     * @return                   itself
     */
    public Optional<FieldType> init(FieldTypeContext context, ContentTypeContext contentTypeContext, DocumentType docType) {
        final Optional<ResourceBundle> resourceBundle = contentTypeContext.getResourceBundle();
        final Node editorFieldConfig = context.getEditorConfigNode();
        final ContentTypeItem item = context.getContentTypeItem();
        final String fieldId = item.getName();

        setId(fieldId);

        LocalizationUtils.determineFieldDisplayName(fieldId, resourceBundle, editorFieldConfig).ifPresent(this::setDisplayName);
        LocalizationUtils.determineFieldHint(fieldId, resourceBundle, editorFieldConfig).ifPresent(this::setHint);

        if (item.isMultiple() || item.getValidators().contains(FieldValidators.OPTIONAL)) {
            setMultiple(true);
        }

        FieldTypeUtils.determineValidators(this, docType, item.getValidators());

        return Optional.of(this);
    }
}
