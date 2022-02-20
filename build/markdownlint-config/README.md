# @mc-discord-bot/markdownlint-config

This exists because the [CLI](https://www.npmjs.com/package/markdownlint-cli2)
and the [VSCode extension](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)
have a different default for the `line-length` rule.

Below is the default for the extension.
It makes a lot of sense,
rules around line length can be frustrating to satisfy for little benefit.

```json
"config": {
  "line-length": false
}
```

## Installation

```sh
npm install --dev markdownlint-cli2 @mc-discord-bot/markdownlint-config
```

## Usage

The purpose of this config is just to avoid repeating the above in a
`.markdownlint-config.*` file in every single project.
Instead, we can point the CLI to the config in this package.

```json
// Example package.json scripts
"scripts": {
  "lint:md": "markdownlint-cli2-config 'node_modules/@mc-discord-bot/markdownlint-config/.markdownlint-cli2.jsonc' '**/*.md' '#node_modules'",
}
```
