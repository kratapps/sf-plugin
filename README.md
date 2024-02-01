# kratapps sf plugin

<!--
[![NPM](https://img.shields.io/npm/v/kratapps.svg?label=kratapps)](https://www.npmjs.com/package/kratapps) [![Downloads/week](https://img.shields.io/npm/dw/kratapps.svg)](https://npmjs.org/package/kratapps) [![License](https://img.shields.io/badge/License-BSD%203--Clause-brightgreen.svg)](https://raw.githubusercontent.com/salesforcecli/kratapps/main/LICENSE.txt)
-->

<!-- toc -->

- [kratapps sf plugin](#kratapps-sf-plugin)
<!-- tocstop -->

<!-- install -->

<!-- commands -->

- [`sf kratapps remote deploy start`](#sf-kratapps-remote-deploy-start)

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

<!-- commandsstop -->
