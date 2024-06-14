# summary

BETA command. Convert CSV file into multiple YAML files, with each record in the CSV saved as a separate YAML file.

# description

Many Salesforce data migration utilities work only with CSV files.

We prefer using YAML files, which are smaller, easier to find and read, and optimized for Git.

Refer to the `sf kratapps data sfdmu csv2yaml` command if you are using the SFDMU plugin.

# flags.preserve-existing.summary

Retain existing records in the output directory.

# flags.external-id.summary

External ID used to name the generated file.

# flags.external-id.description

Can be composite and does not need to be marked as external in Salesforce.

# flags.csv-file.summary

Full file path for CSV file to convert.

# flags.object-name.summary

Name of the object being converted.

# flags.object-name.description

Parsed from the CSV file name if not specified.

# flags.source-dir.summary

Directory root for the generated record files.

# flags.target-org.summary

Org to describe the objects.

# flags.target-org.description

When objects are described, fields such as numbers or booleans are parsed correctly and not retained as strings.

# flags.refresh-schema.summary

Retrieve objects describe even when cached.

# flags.external-id-separator.summary

Separator for composite external ID flag.

# flags.external-value-separator.summary

Separator for composite external ID file names.

# apiVersionMsgDetailed

%s %s metadata to %s using the v%s %s API.

# examples

- <%= config.bin %> <%= command.id %>
