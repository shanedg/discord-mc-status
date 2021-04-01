/**
 * A Discord app with a Bot user that can start and stop a Minecraft server running on a templated EC2 instance:
 * https://discord.com/developers/applications/818225796924702740/bot
 * Constructed by following this guide:
 * https://discordjs.guide/
 */

import discord from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();
const client = new discord.Client();

// const clientId = process.env.CLIENT_ID;
// const clientSecret = process.env.BOT_TOKEN;
// const publicKey = process.env.PUBLIC_KEY;
const {
  BOT_TOKEN: appBotToken,
} = process.env;

client.once('ready', () => {
  console.log('discord-mc-status ready!');
});

client.on('message', message => {
  const { content, author } = message;
  const watchWord = '!server';

  // Ignore any message that doesn't start with the watch word and all messages from bots.
  if (!content.startsWith(watchWord) || author.bot === true) {
    return;
  }

  const watchWordPattern = new RegExp(`\\${watchWord} `);
  const command = content.replace(watchWordPattern, '');
  console.log(`parsed command ${command} from ${content}`);

  switch (command) {
    case 'start':
      message.channel.send('starting server...');
      // TODO: check if server running
      // TODO: capture instance id
      // TODO: associate elastic ip with new instance

      // TODO: start?
      //  aws ec2 run-instances --launch-template LaunchTemplateId=lt-0b091f225fe894a12

      break;
    case 'stop':
      message.channel.send('stopping server...');
      break;
    case 'online':
      // TODO
      break;
    case 'backup':
      message.channel.send('starting backup tasks...');
      // TODO: broadcast 30 second warning
      // TODO: turn off autosave
      // TODO: backup
      // TODO: turn on autosave
      // TODO: broadcast backup complete
      break;
    default:
      message.channel.send('sorry?');
  }
});

client.login(appBotToken);
