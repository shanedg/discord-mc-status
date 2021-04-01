# discord-mc-status

A collection of projects for managing a vanilla Minecraft multiplayer server.

## Set Up

> See ["Getting started as a developer"](https://rushjs.io/pages/developer/new_developer/) for an introduction to working in a Rush monorepo.

Install `rush` globally

```sh
npm i -g @microsoft/rush
```

Install dependencies for all projects

```sh
rush update
```

## Commands

> See ["Everyday commands"](https://rushjs.io/pages/developer/everyday_commands/)
for a guide to the most common commands.
Run `rush -h` or consult the ["Command reference"](https://rushjs.io/pages/commands/rush_add/) for more information.

Rush cheat sheet:

* `rush add -p <package> [--dev]` - add a dependency to the current project according to the working directory and run `rush update`
* `rush build` - build only the projects that have changed
* `rush install` - install dependencies for all projects according to the shrinkwrap file;
unlike `rush update`, won't modify the shrinkwrap file
* `rush list` - list all projects
* `rush purge` - clear caches and remove temporary files
* `rush rebuild` - perform a full, clean build of every project in the repository
* `rush update` - install dependencies for all projects;
run whenever a `package.json` file has changed,
commit any changes it creates under `common/config`;
usually incremental,
run with `--purge` to force a full reinstall of all projects
* `rushx <command>` - run a command in the current project according to the working directory

Custom commands:

> Custom commands are configured in [command-line.json](./common/config/rush/command-line.json).
See ["Custom commands"](https://rushjs.io/pages/maintainer/custom_commands/)
for more information.

* `rush clean`
* `rush lint`

## Troubleshooting

Issue: Unable to resolve a new or updated project module,
especially after `rush purge`.

Related issues:

* [microsoft/rushstack#708](https://github.com/microsoft/rushstack/issues/708),
[rush] NPM 5.x or newer ignores changes for Rush's "file:" version specifiers
* [microsoft/rushstack#886](https://github.com/microsoft/rushstack/issues/886),
[rush] Let's get NPM 6 working with Rush
* [microsoft/rushstack#1706](https://github.com/microsoft/rushstack/issues/1706),
[rush] "rush update" fails if npm-shrinkwrap.json is present (sometimes)
* [microsoft/rushstack#2542](https://github.com/microsoft/rushstack/issues/2542),
[rush] Cannot find installed dependency on rush update

Resolution 1:

> This has been my go-to for a while,
but I suspect much of it is unnecessary or harmful.

```sh
rush clean
rush purge
# This one hurts but is necessary when a stale .tar.gz archive of a local project won't update:
rm common/config/rush/npm-shrinkwrap.json
npm cache clear -f
rush update
```

Resolution 2:

```sh
rush update --full
```
