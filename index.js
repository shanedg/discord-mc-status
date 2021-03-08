/**
 * A Discord app with a Bot user that can start and stop a Minecraft server running on a templated EC2 instance:
 * https://discord.com/developers/applications/818225796924702740/bot
 * Constructed by following this guide:
 * https://discordjs.guide/
 */

import { exec } from 'child_process';

import discord from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const client = new discord.Client();

// const clientId = process.env.CLIENT_ID;
// const clientSecret = process.env.BOT_TOKEN;
// const publicKey = process.env.PUBLIC_KEY;
const { BOT_TOKEN: appBotToken } = process.env;

client.once('ready', () => {
  console.log('discord-mc-status ready!');
});

client.on('message', message => {
  const { content, author } = message;
  const watchWord = '!server';

  // Ignore all messages from bots and any that don't start with the watch word.
  if (!content.startsWith(watchWord) || author.bot === true) {
    return;
  }

  const watchWordPattern = new RegExp(`\\${watchWord} `);
  const command = content.replace(watchWordPattern, '');
  console.log(`parsed command ${command} from ${content}`);

  switch (command) {
    case 'start':
      console.log('TODO: start server');
      message.channel.send('TODO: start server');
      // TODO: check if server running
      //  aws ec2 run-instances --launch-template LaunchTemplateId=lt-0b091f225fe894a12
      exec('echo this would be the command', (error, stdout, stderr) => {
        if (error) {
          console.log('error', error.message);
          return;
        }
        if (stderr) {
          console.log('stderr', stderr);
          return;
        }
        console.log('stdout', stdout);
      });
      // TODO: capture instance id
      break;
    case 'stop':
      console.log('TODO: stop server');
      message.channel.send('TODO: stop server');
      // TODO: broadcast 30 second warning
      // TODO: stop mc server
      // TODO: backup
      // terminate
      // https://docs.aws.amazon.com/cli/latest/reference/ec2/terminate-instances.html
      // aws ec2 terminate-instances --instance-ids i-0904ba119863694ff
      break;
    case 'status':
      console.log('TODO: get server status');
      message.channel.send('TODO: get server status');
      // TODO: get instance status
      // TODO: get server status
      break;
    case 'online':
      console.log('TODO: whos online');
      message.channel.send('TODO: whos online');
      // TODO: get server players
      break;
    case 'backup':
      console.log('TODO: backup server');
      message.channel.send('TODO: backup server');
      // TODO: broadcast 30 second warning
      // TODO: turn off autosave
      // TODO: backup
      // TODO: turn on autosave
      // TODO: broadcast backup complete
      break;
    default:
      console.log('wot?');
      message.channel.send('wot?');
  }
});

client.login(appBotToken);
