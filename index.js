const discord = require('discord.js');
const dotenv = require('dotenv');

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
      break;
    case 'stop':
      console.log('TODO: stop server');
      message.channel.send('TODO: stop server');
      break;
    case 'status':
      console.log('TODO: get server status');
      message.channel.send('TODO: get server status');
      break;
    case 'backup':
      console.log('TODO: backup server');
      message.channel.send('TODO: backup server');
      break;
    default:
      console.log('wot?');
      message.channel.send('wot?');
  }
});

client.login(appBotToken);
