import { Rcon } from 'rcon-client';
import dotenv from 'dotenv';

dotenv.config();

const {
  RCON_HOST: host,
  RCON_PORT: port,
  RCON_SECRET: password,
} = process.env;

const getRconConnection = () => {
  return Rcon.connect({
    host,
    port: Number.parseInt(port),
    password,
  });
};

const countdownSeconds = async ({
  from = 10,
  to = 0,
  step = 1,
}) => {
  const rcon = await getRconConnection();

  await new Promise((resolve, _reject) => {
    let remaining = from;
    let last = remaining;

    rcon.send(`say [testing] ${remaining} seconds`);

    let interval = setInterval(() => {
      remaining -= 1;
      if (last - remaining === step) {
        last = remaining;
        rcon.send(`say [testing] ${remaining} seconds`);
      }
      if (remaining <= to) {
        clearInterval(interval);
        resolve();
      }
    }, 1000);
  });

  rcon.end();
}

const say = async message => {
  const rcon = await getRconConnection();
  const response = await rcon.send(`say [testing] ${message}`);
  rcon.end();
  return response;
};

export {
  countdownSeconds,
  say,
};
