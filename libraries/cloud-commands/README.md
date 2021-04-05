# cloud-commands

This package runs `aws-cli` commands from a subshell (`child_process.exec()`).

> NOTE: All methods depend on `aws-cli` being configured for the shell!
> The associated IAM profile must also have appropriate permissions.

## API

* `launchInstanceFromTemplate` - Run an AWS EC2 instance from a predefined launch template.
* `terminateInstance` - Terminate an AWS EC2 instance.

## Commands

### build

No compilation step for this project.
This is a no-op, always exits with 0 for Rush.

### clean

Remove temporary Rush files.

### lint

Lint JavaScript source files for problems.

### test

> WARNING: Creates resources in the real, billable AWS environment!

Exercise the package exports.
