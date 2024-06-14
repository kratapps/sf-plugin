# summary

BETA command. Generate SOQL.

# description

Generate SOQL via CLI. Used by `sf kratapps sfdmu prepare backup` to create queries dynamically.

# flags.target-org.summary

Username or alias of the target org to describe objects.

# flags.object-name.summary

Target object name for which to generate SOQL.

# flags.by-default.summary

Add 'all' fields and then filter out or add 'none' and filter in.

# flags.type-is.summary

Add fields by type.

# flags.type-is-not.summary

Exclude fields by type.

# flags.name-is.summary

Add fields by name.

# flags.name-is-not.summary

Exclude fields by name.

# flags.relationship-name-is.summary

Add fields by relationship name.

# flags.relationship-name-is-not.summary

Exclude fields by relationship name.

# flags.is-auto-number.summary

Add auto number fields.

# flags.is-not-auto-number.summary

Exclude auto number fields.

# flags.is-calculated.summary

Add calculated fields.

# flags.is-not-calculate.summary

Exclude calculated fields.

# flags.is-createable.summary

Add createable fields.

# flags.is-not-createable.summary

Exclude createable fields.

# flags.is-custom.summary

Add custom fields.

# flags.is-not-custom.summary

Exclude custom fields.

# flags.is-encrypted.summary

Add encrypted fields.

# flags.is-not-encrypted.summary

Exclude encrypted fields.

# flags.is-external-id.summary

Add external ID fields.

# flags.is-not-external-id.summary

Exclude external ID fields.

# flags.is-name-field.summary

Add name fields.

# flags.is-not-name-field.summary

Exclude name fields.

# flags.is-nillable.summary

Add nillable fields.

# flags.is-not-nillable.summary

Exclude nillable fields.

# flags.is-unique.summary

Add unique fields.

# flags.is-not-unique.summary

Exclude unique fields.

# flags.is-updateable.summary

Add updateable fields.

# flags.is-not-updateable.summary

Exclude updateable fields.

# flags.add-parent-field.summary

Add fields from relationship by relationship name.

# flags.add-parent-field.description

<relationshipName>.<fieldsCommaSeparated>
For example to include Name and Username from LastModifiedBy relationship "LastModifiedBy.Name,Username"

# flags.add-ref-field.summary

Add fields from relationship by referenced object.

# flags.add-ref-field.description

<relationshipObjectName>:<fieldsCommaSeparated>
For example to include Name and Username from any relationship to User "User:Name,Username"

# apiVersionMsgDetailed

%s %s metadata to %s using the v%s %s API.

# examples

- <%= config.bin %> <%= command.id %>
