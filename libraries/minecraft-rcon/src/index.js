import { Rcon } from 'rcon-client';

/**
 * Class for managing connections to a Minecraft multiplayer server.
 */
export default class MinecraftRcon {
  constructor({ host, port, password }) {
    this.host = host;
    this.port = port;
    this.password = password;
  }

  /**
   * Create a connection to the Minecraft server.
   * @returns {Promise<Rcon>} Rcon connection
   */
  async getConnection() {
    const rcon = new Rcon({
      host: this.host,
      port:  Number.parseInt(this.port),
      password: this.password,
    });

    return new Promise((resolve, reject) => {
      rcon.connect()
        .then(resolve)
        .catch(error => reject(error));
    });
  };

  /**
   * Create a new connection and run a single command.
   * @param {string} command Command to run
   * @returns {string} Command result
   */
  async run(command) {
    const rcon = await this.getRconConnection();
    const commandResponse = await rcon.send(command);
    rcon.end();
    return commandResponse;
  }

  /**
   * Get a list of players currently on the Minecraft server.
   * @returns {Promise<string[]>} Online players
   */
  async getPlayersOnline() {
    const response = await run('list');
    const [ , players ] = response.split('players online: ');
    return players.split(' ');
  }

  /**
   * Translate names and aliases to Minecraft usernames.
   * @param {string} playerOrAlias Player username, first name, nickname, or misspelling; player or entity selector alias
   * @returns {string} Username or selector
   */
  getUsernameFromAlias(playerOrAlias) {
    switch (playerOrAlias.toLowerCase()) {
      // usernames and first names
      case 'devin':
      case 'jonks':
        return 'Jonks';
      case 'chardlander':
      case 'karl':
      case 'karlton':
        return 'Chardlander';
      case 'maximumburlap':
      case 'neil':
      case 'niel':
        return 'MaximumBurlap';
      case 'nick':
      case 'nickgnack':
        return 'nickgnack';
      case 'crossfire':
      case 'crossfiresdg':
      case 'shan':
      case 'shane':
        return 'crossfiresdg';
      case 'acidjesus':
      case 'zack':
      case 'zach':
        return 'AcidJesus';

      // player shortcuts
      case 'all':
      case 'everybody':
      case 'everyone':
        return '@a'; // all players
      case 'random':
        return '@r'; // random player
      case 'closest':
        return '@p';  // nearest player

      // entity shortcuts
      case 'everything':
        return '@e';  // all entities
      case 'current':
        return '@s'; // current entity

      default:
        return playerOrAlias;
    }
  }
}
