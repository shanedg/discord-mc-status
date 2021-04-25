/**
 * A web server that provides an HTTP interface to a colocated custom vanilla Minecraft server.
 * Assumes that both processes are running on a templated EC2 instance.
 */

// Node internals
import { exec, spawn } from 'child_process';
import path, { dirname } from 'path';

// Third-party
import dotenv from 'dotenv';
import express from 'express';

// Ours
import MinecraftRcon from 'minecraft-rcon';

dotenv.config();

const {
  // Required
  MC_USE_SYSTEMD: useSystemdString,
  MC_WORKING_DIRECTORY: minecraftWorkingDirectory,
  PORT: portString,
  RCON_HOST: rconHost,
  RCON_PORT: rconPort,
  RCON_SECRET: rconPassword,
  // Required only if not using systemd
  MC_JAVA_EXECUTABLE: javaExecutable,
  MC_MAX_GC_PAUSE: maxGCPauseInMs,
  MC_MAXIMUM_MEMORY: maximumMemory,
  MC_MINIMUM_MEMORY: minimumMemory,
} = process.env;

if (
  !minecraftWorkingDirectory ||
  !portString ||
  !rconHost ||
  !rconPort ||
  !rconPassword ||
  !useSystemdString
) {
  throw new Error('Missing configuration. Check ./.env for required variables.');
}

const useSystemd = (useSystemdString.toLowerCase() === 'true' || useSystemdString == 1);

if (!useSystemd &&
  (
    !javaExecutable ||
    !maxGCPauseInMs ||
    !maximumMemory ||
    !minimumMemory
  )
) {
  throw new Error('Missing configuration. Check ./.env for required variables for Java process.');
}

/**
 * Start the Minecraft server as a systemd service unit.
 * @returns {Promise<string>} Result of service start command.
 */
const startSystemdService = () => {
  return new Promise((resolve, reject) => {
    exec('sudo service minecraft start', (error, stdout, stderr) => {
      if (error) {
        console.log(stderr);
        reject(error);
      } else {
        resolve(JSON.parse(stdout));
      }
    });
  });
};

/**
 * Start the Minecraft server as a detached child process.
 * @returns {Promise<ChildProcess>} A reference to the spawned process.
 */
const spawnJavaProcess = ({
  javaExecutable,
  maxGCPauseInMs,
  maximumMemory,
  minecraftWorkingDirectory,
  minimumMemory,
}) => {
  const serverArguments = [
    '-server',
    `-Xms${minimumMemory}`,
    `-Xmx${maximumMemory}`,
    '-XX:+UseG1GC',
    `-XX:MaxGCPauseMillis=${maxGCPauseInMs}`,
    '-jar',
    'server.jar',
    'nogui'
  ];

  const spawnOptions = {
    // Detach spawned process and ignore parent file descriptors.
    // Allows the child to continue running after the parent exits.
    detached: true,
    stdio: 'ignore',
    // Run the spawned process in the minecraft working directory.
    cwd: minecraftWorkingDirectory,
  };

  const minecraftServer = spawn(javaExecutable, serverArguments, spawnOptions);

  // Prevent the parent from waiting for the detached process to exit.
  // Allows the parent to exit independently of the spawned process.
  minecraftServer.unref();

  let badCommand = null;

  minecraftServer.on('error', commandError => {
    console.log('Bad command:', commandError);
    badCommand = commandError;
  });

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!badCommand) {
        resolve(minecraftServer);
      } else {
        reject(badCommand);
      }
    }, 0);
  });
};

/**
 * Start the Minecraft server either directly as a Java process or as a systemd service.
 * @param {boolean} useSystemd Whether the server will run as a systemd service unit.
 * @returns {Promise<*>} Either a reference to the spawned process or the result of the service start command.
 */
const startMinecraftServer = (useSystemd = false) => {
  if (useSystemd) {
    return startSystemdService();
  }

  // Options provided via environment variables.
  const serverOptions = {
    javaExecutable,
    maxGCPauseInMs,
    maximumMemory,
    minecraftWorkingDirectory,
    minimumMemory,
  };

  return spawnJavaProcess(serverOptions);
};

const port = Number.parseInt(portString);
const minecraft = new MinecraftRcon({
  host: rconHost,
  password: rconPassword,
  port: rconPort,
});

const app = express();

app.get('/', (req, res) => {
  res
    .status(200)
    .send(`lifecycle-manager listening at http://localhost:${port}`);
});

/**
 * Handle a request to stop the Minecraft server.
 */
app.post('/stop', (req, res) => {
  // TODO: Check if there is anyone online first.
  // Alternatively, broadcast a warning to anyone playing?
  minecraft.run('stop')
    .then(stopResponse => {
      res.status(200).send(stopResponse);
    })
    .catch(stopError => {
      res.status(500);
      if (stopError?.code === 'ECONNREFUSED') {
        // Infer that the server is already stopped.
        res.status(400);
      }
      res.send(stopError);
    });
});

/**
 * Handle a request to start the Minecraft server.
 */
app.post('/start', (req, res) => {
  minecraft.getPlayersOnline()
    .then(() => {
      // A successful request for players online means the server is already running
      // and we should not try to start it again.
      res.status(409).send('Server is already running!');
    })
    .catch(() => {
      // If the request for players online fails
      // we can infer that the server is not running
      // so go ahead and (try to) start it.
      startMinecraftServer(useSystemd)
        .then(() => {
          res.sendStatus(200);
        })
        .catch(badCommand => {
          res.status(500).send(badCommand);
        });
    });
});

/**
 * Handle a request to backup the Minecraft server.
 */
app.post('/backup', (req, res) => {
  minecraft.runAll([
    'say Create backup',
    'save-all',
  ])
    .then(() => {
      const backupScript = path.resolve(dirname(process.argv[1]), 'backup.sh');
      const backupProcess = spawn(backupScript, [], {
        stdio: 'inherit',
        cwd: minecraftWorkingDirectory,
      });

      backupProcess.unref();
      res.sendStatus(200);
    })
    .catch(saveFailure => {
      res.status(500).send(saveFailure);
    });
});

/**
 * Handle a request to restart the server.
 * Start the server if it's already stopped.
 */
app.post('/restart', (req, res) => {
  minecraft.run('stop')
    .then(() => {
      // If stop succeeds, (re)start the server.
      // TODO: Any risk of starting before server has finished shutting down?
      startMinecraftServer(useSystemd)
        .then(() => {
          res.sendStatus(200);
        })
        .catch(badCommand => {
          res.status(500).send(badCommand);
        });
      return;
    })
    .catch(stopError => {
      if (stopError?.code === 'ECONNREFUSED') {
        // If the request to stop fails we can infer that the server is already stopped
        // so go ahead and (try to) start it.
        startMinecraftServer(useSystemd)
          .then(() => {
            res.sendStatus(200);
          })
          .catch(badCommand => {
            res.status(500).send(badCommand);
          });
        return;
      }

      res.status(500).send(stopError);
    });
});

/**
 * Return a list of players that are currently online.
 */
app.get('/online', (req, res) => {
  minecraft.getPlayersOnline()
    .then(data => {
      res.status(200).send(data);
    })
    .catch(data => {
      res.status(500);
      if (data?.code === 'ECONNREFUSED') {
        res.status(400);
      }
      res.send(data);
    });
});

app.listen(port, () => {
  console.log(`lifecycle-manager listening at http://localhost:${port}`);
});
