# kratapps sf plugin

<!--
[![NPM](https://img.shields.io/npm/v/kratapps.svg?label=kratapps)](https://www.npmjs.com/package/kratapps) [![Downloads/week](https://img.shields.io/npm/dw/kratapps.svg)](https://npmjs.org/package/kratapps) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/kratapps/main/LICENSE.txt)
-->

<!-- toc -->
* [kratapps sf plugin](#kratapps-sf-plugin)
<!-- tocstop -->

<!-- install -->

<!-- commands -->
* [`sf kratapps data csv2yaml`](#sf-kratapps-data-csv2yaml)
* [`sf kratapps query generate`](#sf-kratapps-query-generate)
* [`sf kratapps remote deploy start`](#sf-kratapps-remote-deploy-start)
* [`sf kratapps sfdmu csv2yaml`](#sf-kratapps-sfdmu-csv2yaml)
* [`sf kratapps sfdmu prepare backup`](#sf-kratapps-sfdmu-prepare-backup)
* [`sf kratapps sfdmu yaml2csv`](#sf-kratapps-sfdmu-yaml2csv)

## `sf kratapps data csv2yaml`

BETA command. Convert CSV file into multiple YAML files, with each record in the CSV saved as a separate YAML file.

```
USAGE
  $ sf kratapps data csv2yaml --external-id <value> --csv-file <value> [--json] [--preserve-existing] [--object-name
    <value>] [--source-dir <value>] [-o <value>] [--refresh-schema] [--external-id-separator <value>]
    [--external-value-separator <value>]

FLAGS
  -o, --target-org=<value>                Org to describe the objects.
      --csv-file=<value>                  (required) Full file path for CSV file to convert.
      --external-id=<value>               (required) External ID used to name the generated file.
      --external-id-separator=<value>     [default: ;] Separator for composite external ID flag.
      --external-value-separator=<value>  [default: ;] Separator for composite external ID file names.
      --object-name=<value>               Name of the object being converted.
      --preserve-existing                 Retain existing records in the output directory.
      --refresh-schema                    Retrieve objects describe even when cached.
      --source-dir=<value>                Directory root for the generated record files.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  BETA command. Convert CSV file into multiple YAML files, with each record in the CSV saved as a separate YAML file.

  Many Salesforce data migration utilities work only with CSV files.

  We prefer using YAML files, which are smaller, easier to find and read, and optimized for Git.

  Refer to the `sf kratapps data sfdmu csv2yaml` command if you are using the SFDMU plugin.

EXAMPLES
  $ sf kratapps data csv2yaml

FLAG DESCRIPTIONS
  -o, --target-org=<value>  Org to describe the objects.

    When objects are described, fields such as numbers or booleans are parsed correctly and not retained as strings.

  --external-id=<value>  External ID used to name the generated file.

    Can be composite and does not need to be marked as external in Salesforce.

  --object-name=<value>  Name of the object being converted.

    Parsed from the CSV file name if not specified.
```

## `sf kratapps query generate`

BETA command. Generate SOQL.

```
USAGE
  $ sf kratapps query generate -o <value> --object-name <value> [--json] [--by-default all|none] [--type-is <value>]
    [--type-is-not <value>] [--name-is <value>] [--name-is-not <value>] [--relationship-name-is <value>]
    [--relationship-name-is-not <value>] [--is-auto-number] [--is-not-auto-number] [--is-calculated]
    [--is-not-calculate] [--is-createable] [--is-not-createable] [--is-custom] [--is-not-custom] [--is-encrypted]
    [--is-not-encrypted] [--is-external-id] [--is-not-external-id] [--is-name-field] [--is-not-name-field]
    [--is-nillable] [--is-not-nillable] [--is-unique] [--is-not-unique] [--is-updateable] [--is-not-updateable]
    [--add-parent-field <value>] [--add-ref-field <value>]

FLAGS
  -o, --target-org=<value>                   (required) Username or alias of the target org to describe objects.
      --add-parent-field=<value>...          Add fields from relationship by relationship name.
      --add-ref-field=<value>...             Add fields from relationship by referenced object.
      --by-default=<option>                  [default: all] Add 'all' fields and then filter out or add 'none' and
                                             filter in.
                                             <options: all|none>
      --is-auto-number                       Add auto number fields.
      --is-calculated                        Add calculated fields.
      --is-createable                        Add createable fields.
      --is-custom                            Add custom fields.
      --is-encrypted                         Add encrypted fields.
      --is-external-id                       Add external ID fields.
      --is-name-field                        Add name fields.
      --is-nillable                          Add nillable fields.
      --is-not-auto-number                   Exclude auto number fields.
      --is-not-calculate                     Exclude calculated fields.
      --is-not-createable                    Exclude createable fields.
      --is-not-custom                        Exclude custom fields.
      --is-not-encrypted                     Exclude encrypted fields.
      --is-not-external-id                   Exclude external ID fields.
      --is-not-name-field                    Exclude name fields.
      --is-not-nillable                      Exclude nillable fields.
      --is-not-unique                        Exclude unique fields.
      --is-not-updateable                    Exclude updateable fields.
      --is-unique                            Add unique fields.
      --is-updateable                        Add updateable fields.
      --name-is=<value>...                   Add fields by name.
      --name-is-not=<value>...               Exclude fields by name.
      --object-name=<value>                  (required) Target object name for which to generate SOQL.
      --relationship-name-is=<value>...      Add fields by relationship name.
      --relationship-name-is-not=<value>...  Exclude fields by relationship name.
      --type-is=<value>...                   Add fields by type.
      --type-is-not=<value>...               Exclude fields by type.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  BETA command. Generate SOQL.

  Generate SOQL via CLI. Used by `sf kratapps sfdmu prepare backup` to create queries dynamically.

EXAMPLES
  $ sf kratapps query generate

FLAG DESCRIPTIONS
  --add-parent-field=<value>...  Add fields from relationship by relationship name.

    <relationshipName>.<fieldsCommaSeparated>
    For example to include Name and Username from LastModifiedBy relationship "LastModifiedBy.Name,Username"

  --add-ref-field=<value>...  Add fields from relationship by referenced object.

    <relationshipObjectName>:<fieldsCommaSeparated>
    For example to include Name and Username from any relationship to User "User:Name,Username"
```

## `sf kratapps remote deploy start`

Deploy code from a remote repository.

```
USAGE
  $ sf kratapps remote deploy start -o <value> --repo-owner <value> --repo-name <value> [--json] [--repo-ref <value>] [-d <value>
    |  | -m <value> | ] [--token <value>]

FLAGS
  -d, --source-dir=<value>...  File paths.
  -m, --metadata=<value>...    Metadata component name.
  -o, --target-org=<value>     (required) Login username or alias for the target org.
      --repo-name=<value>      (required) Repository name.
      --repo-owner=<value>     (required) Repository owner.
      --repo-ref=<value>       Repository reference.
      --token=<value>          API token.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Deploy code from a remote repository.

  Similar to the "sf project deploy start" command, but it allows deploying the source from a remote repository, such as
  GitHub.

EXAMPLES
  $ sf kratapps remote deploy start

FLAG DESCRIPTIONS
  -d, --source-dir=<value>...  File paths.

    Path to the remote source files to deploy.

  -m, --metadata=<value>...  Metadata component name.

    Components to deploy.

  -o, --target-org=<value>  Login username or alias for the target org.

    Overrides your default org.

  --repo-name=<value>  Repository name.

    Repository owner, for example component-library in github.com/kratapps/component-library.

  --repo-owner=<value>  Repository owner.

    Repository owner, for example kratapps in github.com/kratapps/component-library.

  --repo-ref=<value>  Repository reference.

    Git branch name, rev, tag.

  --token=<value>  API token.

    API token to the external service, e.g. GitHub API Token.
    Required for private repositories and to increase GitHub API request limit.
```

## `sf kratapps sfdmu csv2yaml`

BETA command. Convert CSV files generated by SFDMU plugin into multiple YAML files, with each record in the CSV saved as a separate YAML file.

```
USAGE
  $ sf kratapps sfdmu csv2yaml [--json] [--preserve-existing] [--sfdmu-dir <value>] [--source-dir <value>] [-o <value>]
    [--refresh-schema] [--operations <value>]

FLAGS
  -o, --target-org=<value>  Org to describe the objects.
      --operations=<value>  [default: Insert;Update;Upsert] Filter object configuration based on SFDMU operation.
      --preserve-existing   Retain existing records in the output directory.
      --refresh-schema      Retrieve objects describe even when cached.
      --sfdmu-dir=<value>   [default: out] SFDMU root directory containing the retrieved CSV files.
      --source-dir=<value>  [default: data] Directory root for the generated record files.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  BETA command. Convert CSV files generated by SFDMU plugin into multiple YAML files, with each record in the CSV saved
  as a separate YAML file.

  The SFDMU plugin works only with CSV files.

  We prefer using YAML files, which are smaller, easier to find and read, and optimized for Git.

EXAMPLES
  $ sf kratapps sfdmu csv2yaml

FLAG DESCRIPTIONS
  -o, --target-org=<value>  Org to describe the objects.

    When objects are described, fields such as numbers or booleans are parsed correctly and not retained as strings.
```

## `sf kratapps sfdmu prepare backup`

Simplify data backups into git using the SFDMU plugin.

```
USAGE
  $ sf kratapps sfdmu prepare backup [--json] [--sfdmu-dir <value>] [--source-dir <value>] [-o <value>]
  [--refresh-schema]

FLAGS
  -o, --target-org=<value>  Org to describe the objects.
      --refresh-schema      Retrieve objects describe even when cached.
      --sfdmu-dir=<value>   [default: out] SFDMU root directory for generated script.
      --source-dir=<value>  [default: data] Directory root with custom backup.yaml config.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Simplify data backups into git using the SFDMU plugin.

  Prepares data backup configuration for SFDMU plugin.

EXAMPLES
  $ sf kratapps sfdmu prepare backup

FLAG DESCRIPTIONS
  -o, --target-org=<value>  Org to describe the objects.

    Required for query generation.
```

## `sf kratapps sfdmu yaml2csv`

BETA command. Convert multiple YAML files into a single CSV files per object.

```
USAGE
  $ sf kratapps sfdmu yaml2csv [--json] [--source-dir <value>] [--sfdmu-dir <value>] [--operations <value>]

FLAGS
  --operations=<value>  [default: Insert;Update;Upsert] Filter object configuration based on SFDMU operation.
  --sfdmu-dir=<value>   [default: out] SFDMU root directory containing the generated CSV files.
  --source-dir=<value>  [default: data] Directory containing records generated by `sf kratapps data sfdmu csv2yaml`
                        command.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  BETA command. Convert multiple YAML files into a single CSV files per object.

  The SFDMU plugin works only with CSV files.

  We prefer using YAML files, which are smaller, easier to find and read, and optimized for Git.

EXAMPLES
  $ sf kratapps sfdmu yaml2csv
```
<!-- commandsstop -->
