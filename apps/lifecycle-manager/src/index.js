/**
 * A web server that provides an HTTP interface to a colocated custom vanilla Minecraft server.
 * Assumes that both processes are running on a templated EC2 instance.
 */

// Node internals
import { exec } from 'child_process';
import path, { dirname } from 'path';

// Third-party
import dotenv from 'dotenv';
import express from 'express';

// Ours
import MinecraftRcon from 'minecraft-rcon';

dotenv.config();

const {
  PORT: portString,
  RCON_HOST: rconHost,
  RCON_PORT: rconPort,
  RCON_SECRET: rconPassword,
} = process.env;

if (!portString || !rconHost || !rconPort || !rconPassword) {
  throw new Error('Missing configuration. Check ./.env for required variables.');
}

const port = Number.parseInt(portString);
const minecraft = new MinecraftRcon({
  host: rconHost,
  password: rconPassword,
  port: rconPort,
});

const app = express();

app.get('/', (_req, res) => {
  res
    .status(200)
    .send(`lifecycle-manager listening at http://localhost:${port}`);
});

/**
 * Handle a request to stop the Minecraft server.
 */
app.post('/stop', (_req, res) => {
  minecraft.run('stop')
    .then(stopResponse => {
      // expected response: { command: 'stop', response: 'Stopping the server' }
      res.status(200).send(stopResponse);
    })
    .catch(stopError => {
      res.status(500);
      if (stopError?.code === 'ECONNREFUSED') {
        // expected response:
        // {
        //   errno: -61,
        //   code: 'ECONNREFUSED',
        //   syscall: 'connect',
        //   address: '127.0.0.1',
        //   port: 25575
        // }
        res.status(400);
        console.log('Could not reach the server. Is it already stopped?');
      }
      res.send(stopError);
    });
});

/**
 * Handle a request to start the Minecraft server.
 */
app.post('/start', (_req, res) => {
  // TODO: How configurable does this need to be?
  const startScript = path.resolve(dirname(process.argv[1]), 'start.sh');
  exec(startScript, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(error);
      return;
    }

    // res.status(200).send({ stderr, stdout });
    res.sendStatus(200);
  });
});

/**
 * Handle a request to backup the Minecraft server.
 */
app.post('/backup', (_req, res) => {
  // TODO: How configurable does this need to be?
  const backupScript = path.resolve(dirname(process.argv[1]), 'backup.sh');
  exec(backupScript, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(error);
      return;
    }

    res.status(200).send({ stderr, stdout });
  });
});

/**
 * Handle a request to restart the server.
 * Will try to start the server if it's already stopped.
 */
app.post('/restart', (_req, res) => {
  const startScript = path.resolve(dirname(process.argv[1]), 'start.sh');
  minecraft.run('stop')
    .then(() => {
      exec(startScript, (error, stdout, stderr) => {
        if (error) {
          res.status(500).send(error);
          return;
        }

        res.status(200).send({ stderr, stdout });
      });
    })
    .catch(stopError => {
      if (stopError?.code === 'ECONNREFUSED') {
        exec(startScript, (error, stdout, stderr) => {
          if (error) {
            res.status(500).send(error);
            return;
          }

          res.status(200).send({ stderr, stdout });
        });
        return;
      }

      res.status(500).send(stopError);
    });
});

/**
 * Return a list of players that are currently online.
 */
app.get('/online', (_req, res) => {
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
