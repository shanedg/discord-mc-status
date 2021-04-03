# lifecycle-manager

A Node server for managing the lifecycle of a vanilla Minecraft multiplayer server.

## Commands

### build

No compilation step for this project.
This is a no-op, always exits with 0 for Rush.

### clean

Remove temporary Rush files.

### dev

Start the Minecraft manager server and restart when files change.

FYI, when [nodemon](https://www.npmjs.com/package/nodemon) detects file changes
it sends a kill signal to every process in the process tree.
That will include the spawned Minecraft server process.
By default, the signal sent is `SIGUSR2`.
Minecraft does not handle this signal and crashes.
Instead, we use `--signal SIGTERM` so that the Minecraft server can shut down gracefully.

### lint

Lint JavaScript source files for problems.

### start

Start the Minecraft manager server.
