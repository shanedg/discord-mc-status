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
    const rcon = await this.getConnection();
    const commandResponse = await rcon.send(command);
    rcon.end();
    return commandResponse;
  }

  /**
   * Get a list of players currently on the Minecraft server.
   * @returns {Promise<string[]>} Online players
   */
  async getPlayersOnline() {
    const response = await this.run('list');
    const [ , players ] = response.split('players online: ');
    return players.split(' ');
  }
}