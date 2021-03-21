/**
 * A Discord app with a Bot user that can start and stop a Minecraft server running on a templated EC2 instance:
 * https://discord.com/developers/applications/818225796924702740/bot
 * Constructed by following this guide:
 * https://discordjs.guide/
 */

import discord from 'discord.js';
import dotenv from 'dotenv';

import {
  backup,
  online,
  sorry,
  start,
  status,
  stop,
} from './bot-commands.js';

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
      start(message);
      break;
    case 'stop':
      stop(message);
      break;
    case 'status':
      status(message);
      break;
    case 'online':
      online(message);
      break;
    case 'backup':
      backup(message);
      break;
    default:
      sorry(message);
  }
});

client.login(appBotToken);
