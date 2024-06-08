# summary

BETA command. Convert CSV files generated by SFDMU plugin into multiple YAML files, with each record in the CSV saved as a separate YAML file.

# description

The SFDMU plugin works only with CSV files.

We prefer using YAML files, which are smaller, easier to find and read, and optimized for Git.

# flags.preserve-existing.summary

Retain existing records in the output directory.

# flags.csv-dir.summary

SFDMU root directory containing the retrieved CSV files.

# flags.config-file.summary

Full file path for SFDMU config (export.json).

# flags.output-dir.summary

Directory root for the generated record files.

# flags.schema-org.summary

Org to describe the objects.

# flags.schema-org.description

When objects are described, fields such as numbers or booleans are parsed correctly and not retained as strings.

# flags.refresh-schema.summary

Retrieve objects describe even when cached.

# apiVersionMsgDetailed

%s %s metadata to %s using the v%s %s API.

# examples

- <%= config.bin %> <%= command.id %>