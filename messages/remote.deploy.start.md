# summary

Deploy code from a remote repository.

# description

Similar to the "sf project deploy start" command, but it allows deploying the source from a remote repository, such as GitHub.

# flags.target-org.summary

Login username or alias for the target org.

# flags.target-org.description

Overrides your default org.

# flags.repo-owner.summary

Repository owner.

# flags.repo-owner.description

Repository owner, for example kratapps in github.com/kratapps/component-library.

# flags.repo-name.summary

Repository name.

# flags.repo-name.description

Repository owner, for example component-library in github.com/kratapps/component-library.

# flags.repo-ref.summary

Repository reference.

# flags.repo-ref.description

Git branch name, rev, tag.

# flags.source-dir.summary

File paths.

# flags.source-dir.description

Path to the remote source files to deploy.

# flags.metadata.summary

Metadata component name.

# flags.metadata.description

Components to deploy.

# flags.token.summary

API token.

# flags.token.description

API token to the external service, e.g. GitHub API Token.
Required for private repositories and to increase GitHub API request limit.

# apiVersionMsgDetailed

%s %s metadata to %s using the v%s %s API.

# examples

- <%= config.bin %> <%= command.id %>
