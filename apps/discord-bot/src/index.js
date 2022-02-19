/**
 * A Discord app with a Bot user that can start and stop a Minecraft server running on a templated EC2 instance:
 * https://discord.com/developers/applications/818225796924702740/bot
 * Constructed by following this guide:
 * https://discordjs.guide/
 */

// Node internals.
import {
  exec,
  execSync,
} from 'child_process';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import path, { dirname } from 'path';

// Third-party
import axios from 'axios';
import { Client, Intents } from 'discord.js';
import dotenv from 'dotenv';

// Ours
import {
  describeInstance,
  launchInstanceFromTemplate,
  launchInstanceFromTemplateWithUserData,
  terminateInstance,
} from 'cloud-commands';

const __dirname = dirname(fileURLToPath(import.meta.url));

let lastInstanceId = null;
let lastInstanceIpAddress = null;

/**
 * Persist the instance Id of a running server in a temporary file.
 */
const saveOnExit = () => {
  if (!lastInstanceId) {
    process.exit();
  }

  try {
    execSync(`echo "${lastInstanceId}" > .temp-last-instance-id`);
    execSync(`echo "${lastInstanceIpAddress}" > .temp-last-ip-address`);
  } catch (error) {
    console.log('Problem saving data to a temporary file:', error);
  }
  process.exit();
};

process.on('SIGINT', saveOnExit); // Ctrl-c
process.on('SIGUSR2', saveOnExit); // nodemon signal
process.on('SIGTERM', saveOnExit); // systemd 'stop' signal
process.on('exit', saveOnExit); // any exit?

exec('cat .temp-last-instance-id', (error, stdout, stderr) => {
  if (error) {
    if (stderr.includes('No such file or directory')) {
      // No cached data.
      return;
    }

    throw error;
  } else {
    // Recover cached data and remove temporary file.
    lastInstanceId = stdout.trim();
    console.log('Found cached instance with Id:', lastInstanceId);
    execSync('rm .temp-last-instance-id');
  }
});

exec('cat .temp-last-ip-address', (error, stdout, stderr) => {
  if (error) {
    if (stderr.includes('No such file or directory')) {
      // No cached data.
      return;
    }

    throw error;
  } else {
    // Recover cached data and remove temporary file.
    lastInstanceIpAddress = stdout.trim();
    console.log('Found cached IP address:', lastInstanceIpAddress);
    execSync('rm .temp-last-ip-address');
  }
});

dotenv.config();

const {
  BOT_TOKEN: appBotToken,
  LIFECYCLE_PORT: lifecyclePort,
} = process.env;

let bot;
try {
  bot = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
} catch(e) {
  console.log(e);
  process.exit(1);
}

bot.once('ready', () => {
  console.log('discord-bot ready!');
});

bot.on('message', (message) => {
  const { content, author } = message;
  const watchWord = '!server';

  // Ignore any message that doesn't start with the watch word and all messages from bots.
  if (!content.startsWith(watchWord) || author.bot === true) {
    return;
  }

  const watchWordPattern = new RegExp(`\\${watchWord} `);
  const commandArguments = content.replace(watchWordPattern, '').split(' ');
  const command = commandArguments[0];

  switch (command) {
  case 'start':
    // Launch legacy smp world
    if (lastInstanceId) {
      message.channel.send('The server is already running, nothing to do.');
    } else if (!lastInstanceId && commandArguments.length === 1) {
      launchInstanceFromTemplate()
        .then(launchResult => {
          const instanceId = launchResult.Instances[0].InstanceId;
          console.log('Created instance with Id:', instanceId);
          lastInstanceId = instanceId;
          lastInstanceIpAddress = 'craft.trshcmpctr.com';
          message.channel.send('The server is starting up at craft.trshcmpctr.com');
          return instanceId;
        })
        .catch(error => {
          // Expected error if trying to start server before last one is finished terminating.
          if (error.toString().indexOf('InvalidNetworkInterface.InUse') > -1) {
            message.channel.send('A previous version of the server is still running, please try again in a few minutes.');
          } else {
            console.log('There was a problem launching a new EC2 instance:', error);
            message.channel.send('There was a problem starting the server!');
          }
        });

    } else if (!lastInstanceId && commandArguments.length > 1) {
      const requestNewWorld = commandArguments[1] === 'new';
      const newWorldNameProvided = commandArguments.length > 2;

      if (requestNewWorld && !newWorldNameProvided) {
        message.channel.send('Bad request. Try "!server start [new] [world-name]"');
        return;
      }
      const isNewNamedWorld = requestNewWorld && newWorldNameProvided;
      const worldName = isNewNamedWorld ? commandArguments[2] : commandArguments[1];

      // Launch a named world
      const userData = readFileSync(
        path.join(__dirname, isNewNamedWorld ? 'user-data-new.sh' : 'user-data-existing.sh'),
        { encoding: 'utf-8' }
      );

      launchInstanceFromTemplateWithUserData({
        userData,
        worldName,
      })
        .then(launchResult => {
          const instanceId = launchResult.Instances[0].InstanceId;
          console.log(`Created instance of ${isNewNamedWorld ? 'new' : 'existing'} world ${worldName} with Id: ${instanceId}`);
          lastInstanceId = instanceId;
          return instanceId;
        })
        .then(instanceId => {
          return describeInstance(instanceId);
        })
        .then(instanceDescription => {
          const { InstanceId, PublicDnsName, PublicIpAddress } = instanceDescription.Reservations[0].Instances[0];
          lastInstanceIpAddress = PublicIpAddress;
          console.log(`Public DNS Name: ${PublicDnsName}\nPublic IP Address: ${PublicIpAddress}`);
          message.channel.send(`The server is starting up at ${PublicIpAddress}`);
          return {
            InstanceId,
            PublicDnsName,
            PublicIpAddress,
          };
        })
        .catch(error => {
          console.log('There was a problem launching a new EC2 instance:', error);
          message.channel.send('There was a problem starting the server!');
        });
    }
    break;
  case 'stop':
    if (lastInstanceId) {
      message.channel.send('Creating a backup...');
      axios.post(`http://${lastInstanceIpAddress}:${lifecyclePort}/backup-sync`)
        .then(() => {
          message.channel.send('Backup complete. Stopping the server...');
        })
        .then(() => {
          return axios.post(`http://${lastInstanceIpAddress}:${lifecyclePort}/stop`);
        })
        .catch(lifecycleError => {
          const { response } = lifecycleError;
          if (response?.status === 400) {
            console.log('The server may have been partially stopped.');
            // Don't re-throw!
            // The server process may have exited
            // but the instance might still need to be cleaned up below.
          } else {
            console.log('Unexpected problem reaching lifecycle-manager:', lifecycleError);
            throw lifecycleError;
          }
        })
        .then(() => terminateInstance(lastInstanceId))
        .then(() => {
          console.log('Terminated instance with Id:', lastInstanceId);
          lastInstanceId = null;
          lastInstanceIpAddress = null;
          message.channel.send('Server stopped.');
        })
        .catch(error => {
          console.log('Problem stopping the server:', error);
          message.channel.send('There was a problem stopping the server :(');
        });
    } else {
      message.channel.send('No server running, nothing to do.');
    }
    break;
  case 'online':
    if (lastInstanceId) {
      axios.get(`http://${lastInstanceIpAddress}:${lifecyclePort}/online`)
        .then(onlineResponse => {
          console.log('onlineResponse:', onlineResponse);
          const players = onlineResponse.data;
          console.log('players:', players);
          message.channel.send(`Online: ${players.length}/20\n${players.join(',')}`);
        })
        .catch(onlineError => {
          const { response } = onlineError;
          if (response?.status === 400) {
            message.channel.send('Server stopped.');
          } else {
            console.log('Problem checking who\'s online:', onlineError);
            message.channel.send('There was an unexpected problem checking who\'s online :(');
          }
        });
    } else {
      message.channel.send('No server running.');
    }
    break;
  case 'backup':
    // TODO: broadcast 30 second warning
    // TODO: broadcast backup complete
    if (lastInstanceId) {
      message.channel.send('Creating a backup...');
      axios.post(`http://${lastInstanceIpAddress}:${lifecyclePort}/backup-sync`)
        .then(() => {
          message.channel.send('Backup complete.');
        })
        .catch(backupError => {
          console.log('Backup error:', backupError);
          message.channel.send('There was a problem creating a backup!');
        });
    } else {
      message.channel.send('No server running.');
    }
    break;
  case 'help':
  default:
    message.channel.send('Sorry?');
    // TODO: display help summary of commands
    // https://discordjs.guide/command-handling/adding-features.html#a-dynamic-help-command
  }
});

bot.login(appBotToken);
