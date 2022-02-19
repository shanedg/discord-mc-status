# lifecycle-manager

A Node server for managing the lifecycle of a vanilla Minecraft multiplayer server.

## Configuration

Important configuration values are set in a `.env` file in the project root.

Start by copying [.env.sample](./.env.sample) to `.env`.
At a minimum, you will need to set `MC_WORKING_DIRECTORY` to the location of the Minecraft server files
and `RCON_SECRET` to the Minecraft server's Rcon password.

Minecraft server arguments:

* `MC_JAVA_EXECUTABLE` - path to Java binary
* `MC_MAX_GC_PAUSE` - target for maximum Java garbage collection pause time in milliseconds
* `MC_MAXIMUM_MEMORY` - maximum memory for Java
* `MC_MINIMUM_MEMORY` - minimum memory for Java
* `MC_USE_SYSTEMD` - control whether the Minecraft server will run directly as a Java process
or as a systemd service unit;
if `true`, Java server arguments are ignored in favor of the `minecraft.service` definition
* `MC_WORKING_DIRECTORY` - location of the Minecraft server files
* `MC_WORLD_NAME` - unique identifier for Minecraft server backups

`lifecycle-manager` values:

* `PORT` - port for `lifecycle-manager` to listen on for server management requests

Rcon values:

* `RCON_HOST` - Minecraft server host
* `RCON_PORT` - Minecraft server Rcon port
* `RCON_SECRET` - Minecraft server Rcon password

## Commands

### build

No compilation step for this project.
This is a no-op, always exits with 0 for Rush.

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
