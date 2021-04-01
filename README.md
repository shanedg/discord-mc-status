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
