/**
 * A Discord app with a Bot user that can start and stop a Minecraft server running on a templated EC2 instance:
 * https://discord.com/developers/applications/818225796924702740/bot
 * Constructed by following this guide:
 * https://discordjs.guide/
 */

import axios from 'axios';
import discord from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const {
  BOT_TOKEN: appBotToken,
  LIFECYCLE_BASE_URL: lifecycleBaseUrl,
} = process.env;

const axiosInstance = axios.create({
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
      message.channel.send('starting server...');
      // TODO: check if server running
      // TODO: capture instance id
      // TODO: associate elastic ip with new instance

      // TODO: start?
      //  aws ec2 run-instances --launch-template LaunchTemplateId=lt-0b091f225fe894a12

      break;
    case 'stop':
      message.channel.send('stopping server...');
      axiosInstance.post('/stop')
        .then(() => {
          message.channel.send('server stopped.');
        })
        .catch(({ response }) => {
          if (response?.status === 400) {
            message.channel.send('connection refused, the server is (probably) already stopped.');
          } else {
            message.channel.send('there was an unexpected problem stopping the server!');
          }
        });
      break;
    case 'online':
      axiosInstance.get('/online')
        .then(({ data }) => {
          message.channel.send(`online: ${data.length}/20\n${data.join(',')}`);
        })
        .catch(({ response }) => {
          if (response?.status === 400) {
            message.channel.send('connection refused, the server is probably stopped.');
          } else {
            message.channel.send('there was an unexpected problem checking who\'s online!');
          }
        });
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

bot.login(appBotToken);
