import dotenv from 'dotenv';

/**
 * System under test
 */
import MinecraftRcon from './MinecraftRcon.js';

/**
 * Configure test environment
 */
dotenv.config();
const {
  RCON_HOST: host,
  RCON_PORT: port,
  RCON_SECRET: password,
} = process.env;

const minecraft = new MinecraftRcon({ host, port, password });

const exerciseRunAll = async () => {
  const results = await minecraft.runAll([
    'list',
    'say hello everyone',
    'tell @r hello to you in particular, random!',
    'save-off',
    'save-on',
  ]);
  console.log('runAll:', results);
};

const exercisePlayersOnline = async () => {
  const playersOnline = await minecraft.getPlayersOnline();
  console.log('online:', playersOnline);
};

// ESLint can't parse top-level await out of the box.
(async () => {
  await exerciseRunAll();
  await exercisePlayersOnline();
})();
