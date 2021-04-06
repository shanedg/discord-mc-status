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

// Third-party
import axios from 'axios';
import discord from 'discord.js';
import dotenv from 'dotenv';

// Ours
import {
  launchInstanceFromTemplate,
  terminateInstance,
} from 'cloud-commands';

let lastInstanceId = null;

/**
 * Persist the instance Id of a running server in a temporary file.
 */
const saveOnExit = () => {
  if (!lastInstanceId) {
    process.exit();
  }

  try {
    execSync(`echo "${lastInstanceId}" > .temp-last-instance-id`);
  } catch (error) {
    console.log('Problem saving data to a temporary file:', error);
  }
  process.exit();
};

process.on('SIGINT', saveOnExit); // Ctrl-c
process.on('SIGUSR2', saveOnExit); // nodemon signal

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

dotenv.config();

const {
  BOT_TOKEN: appBotToken,
  LIFECYCLE_BASE_URL: lifecycleBaseUrl,
} = process.env;

const lifecycleHost = axios.create({
  baseURL: lifecycleBaseUrl,
});

const bot = new discord.Client();

bot.once('ready', () => {
  console.log('discord-bot ready!');
});

bot.on('message', message => {
  const { content, author } = message;
  const watchWord = '!server';

  // Ignore any message that doesn't start with the watch word and all messages from bots.
  if (!content.startsWith(watchWord) || author.bot === true) {
    return;
  }

  const watchWordPattern = new RegExp(`\\${watchWord} `);
  const command = content.replace(watchWordPattern, '');

  switch (command) {
  case 'start':
    if (!lastInstanceId) {
      launchInstanceFromTemplate()
        .then(launchResult => {
          const instanceId = launchResult.Instances[0].InstanceId;
          console.log('Created instance with Id:', instanceId);
          lastInstanceId = instanceId;
          message.channel.send('The server is starting...');
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

      // TODO: can the new instance pull the latest backup and start the server via user-data?
      // TODO: Or does this distributed system need more moving parts???
    } else {
      message.channel.send('The server is already running, nothing to do.');
    }
    break;
  case 'stop':
    if (lastInstanceId) {
      message.channel.send('Stopping the server...');
      lifecycleHost.post('/stop')
        .catch(stopError => {
          const { response } = stopError;
          if (response?.status === 400) {
            console.log('The server may have been partially stopped.');
            // Don't re-throw!
            // The server process may have exited
            // but the instance might still need to be cleaned up below.
          } else {
            console.log('Unexpected problem reaching lifecycle-manager:', stopError);
            throw stopError;
          }
        })
        // TODO: create backup before terminating the instance
        .then(() => terminateInstance(lastInstanceId))
        .then(() => {
          console.log('Terminated instance with Id:', lastInstanceId);
          lastInstanceId = null;
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
    lifecycleHost.get('/online')
      .then(({ data }) => {
        message.channel.send(`Online: ${data.length}/20\n${data.join(',')}`);
      })
      .catch(onlineError => {
        const { response } = onlineError;
        if (response?.status === 400) {
          message.channel.send('No server running.');
        } else {
          console.log('Problem checking who\'s online:', onlineError);
          message.channel.send('There was an unexpected problem checking who\'s online :(');
        }
      });
    break;
  case 'backup':
    message.channel.send('Backup tasks are not yet implemented...');
    // TODO: broadcast 30 second warning
    // TODO: turn off autosave
    // TODO: backup
    // TODO: turn on autosave
    // TODO: broadcast backup complete
    break;
  case 'help':
  default:
    message.channel.send('Sorry?');
    // TODO: display help summary of commands
    // https://discordjs.guide/command-handling/adding-features.html#a-dynamic-help-command
  }
});

bot.login(appBotToken);
