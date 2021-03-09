import { exec } from 'child_process';

import {
  countdownSeconds,
  say,
} from './minecraft-commands.js';

const start = message => {
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
};

const stop = async message => {
  console.log('TODO: stop server');
  message.channel.send('TODO: stop server');
  // say('stopping the server in 30 seconds...');
  await countdownSeconds({ from: 30, to: 10, step: 5});
  await countdownSeconds({ from: 9 });

  // TODO: broadcast 30 second warning
  // TODO: stop mc server
  // TODO: backup
  // terminate
  // https://docs.aws.amazon.com/cli/latest/reference/ec2/terminate-instances.html
  // aws ec2 terminate-instances --instance-ids i-0904ba119863694ff
};

const status = message => {
  console.log('TODO: get server status');
  message.channel.send('TODO: get server status');
  // TODO: get instance status
  // TODO: get server status
};

const online = message => {
  console.log('TODO: whos online');
  message.channel.send('TODO: whos online');
  // TODO: get server players
};

const backup = message => {
  console.log('TODO: backup server');
  message.channel.send('TODO: backup server');
  // TODO: broadcast 30 second warning
  // TODO: turn off autosave
  // TODO: backup
  // TODO: turn on autosave
  // TODO: broadcast backup complete
};

const sorry = message => {
  console.log('TODO: sorry');
  message.channel.send('TODO: sorry?');
};

export {
  backup,
  online,
  sorry,
  start,
  status,
  stop,
};
