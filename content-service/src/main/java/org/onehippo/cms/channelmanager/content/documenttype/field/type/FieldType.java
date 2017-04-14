package org.onehippo.cms.channelmanager.content.documenttype.field.type;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import javax.jcr.Node;

import org.onehippo.cms.channelmanager.content.document.model.FieldValue;
import org.onehippo.cms.channelmanager.content.documenttype.field.FieldTypeContext;
import org.onehippo.cms.channelmanager.content.documenttype.model.DocumentType;
import org.onehippo.cms.channelmanager.content.error.ErrorWithPayloadException;

/**
 * A field type in a {@link DocumentType}.
 */
public interface FieldType {

    enum Type {
        STRING,
        MULTILINE_STRING,
        HTML,
        CHOICE, // "content blocks"
        COMPOUND
    }

    /**
     *  The 'REQUIRED' validator is meant to indicate that a primitive field must have content. What exactly that
     *  means depends on the field type. The 'REQUIRED' validator is *not* meant to indicate that at least one
     *  instance of a multiple field must be present.
     */
    enum Validator {
        REQUIRED,
        UNSUPPORTED
    }

    String getId();

    void setId(String id);

    AbstractFieldType.Type getType();

    String getDisplayName();

    void setDisplayName(String displayName);

    String getHint();

    void setHint(String hint);

    int getMinValues();

    void setMinValues(int minValues);

    int getMaxValues();

    void setMaxValues(int maxValues);

    Set<AbstractFieldType.Validator> getValidators();

    void addValidator(AbstractFieldType.Validator validator);

    boolean isRequired();

    boolean hasUnsupportedValidator();

    boolean isValid();

    void init(FieldTypeContext fieldContext);

    /**
     * Read a document field instance from a document variant node
     *
     * @param node JCR node to read the value from
     * @return     Object representing the values, or nothing, wrapped in an Optional
     */
    Optional<List<FieldValue>> readFrom(Node node);

    /**
     * Write the optional value of this field to the provided JCR node.
     *
     * We purposefully pass in the value as an optional, because the validation of the cardinality constraint
     * happens during this call. If we would not do the call if the field has no value, then the validation
     * against the field's cardinality constraints or against the field's current number of values would not
     * take place.
     *
     * @param node          JCR node to store the value on
     * @param optionalValue value to write, or nothing, wrapped in an Optional
     * @throws ErrorWithPayloadException
     *                      indicates that writing the provided value ran into an unrecoverable error
     */
    void writeTo(Node node, Optional<List<FieldValue>> optionalValue) throws ErrorWithPayloadException;

    /**
     * Validate the current value of this field against all applicable (and supported) validators.
     *
     * @param valueList list of field value(s) to validate
     * @return          true upon success, false if at least one validation error was encountered.
     */
    boolean validate(List<FieldValue> valueList);
}
