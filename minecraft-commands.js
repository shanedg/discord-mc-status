import { Rcon } from 'rcon-client';
import dotenv from 'dotenv';

dotenv.config();

const {
  RCON_HOST: host,
  RCON_PORT: port,
  RCON_SECRET: password,
} = process.env;

const getRconConnection = async () => {
  const rcon = new Rcon({
    host,
    port: Number.parseInt(port),
    password,
  });

  rcon.on('connect', () => {
    console.log('rcon connected');
  });

  rcon.on('authenticated', () => {
    console.log('rcon authenticated');
  });

  rcon.on('end', () => {
    console.log('rcon disconnected');
  });

  rcon.on('error', () => {
    console.log('rcon error');
  });

  await rcon.connect();

  return rcon;
};

const countDownSeconds = async (options = {
  from: 10,
  to: 0,
  step: 1,
}) => {
  const { from, to, step } = options;
  const rcon = await getRconConnection();

  await new Promise((resolve, _reject) => {
    let remaining = from;
    let last = remaining;

    rcon.send(`say ${remaining}`);

    let interval = setInterval(() => {
      remaining -= 1;
      if (last - remaining === step) {
        last = remaining;
        rcon.send(`say ${remaining}`);
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
  const response = await rcon.send(`say ${message}`);
  rcon.end();
  return response;
};

const autoSaveOff = async () => {
  const rcon = await getRconConnection();
  const response = await rcon.send('save-off');
  rcon.end();
  return response;
};

const autoSaveOn = async () => {
  const rcon = await getRconConnection();
  const response = await rcon.send('save-on');
  rcon.end();
  return response;
};

const stopServer = async () => {
  const rcon = await getRconConnection();
  const response = await rcon.send('stop');
  rcon.end();
  return response;
};

const mandelbrot = async () => {
  const rcon = await getRconConnection();

  // https://github.com/janispritzkau/rcon-client/blob/master/examples/map.ts
  const start = Date.now();
  for (let j = 0; j < 128 ** 2; j++) {
    const x = j % 128, y = (j / 128) | 0

    const c_re = (2 * x / 127 - 1.6) * 1.2
    const c_im = (2 * y / 127 - 1) * 1.2
    let z_re = 0, z_im = 0, i = 0

    while (i < 23 && z_re ** 2 + z_im ** 2 < 4) {
        let re = z_re ** 2 - z_im ** 2 + c_re
        z_im = 2 * z_re * z_im + c_im
        z_re = re
        i += 1
    }

    const block = ["obsidian", "obsidian", "blue_terracotta", "cyan_wool", "light_blue_wool", "white_wool"][(i / 4) | 0]
    await rcon.send(`/setblock ${-64 + x} ${64} ${-64 + y} ${block}`)
  }
  const elapsed = Date.now() - start;
  console.log(`Took ${elapsed / 1000} seconds`);

  rcon.end();
};

const ping = async () => {
  const rcon = await getRconConnection();
  rcon.end();
};

const list = async () => {
  const rcon = await getRconConnection();
  const response = await rcon.send('list');
  rcon.end();
  console.log('list', response);
  return response;
}

export {
  autoSaveOff,
  autoSaveOn,
  countDownSeconds,
  list,
  mandelbrot,
  ping,
  say,
  stopServer,
};
