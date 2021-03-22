/**
 * Translate names and aliases to Minecraft usernames.
 * @param {string} playerOrAlias Player username, first name, nickname, or misspelling; player or entity selector alias
 * @returns {string} Username or selector
 */
function getUsernameFromAlias(playerOrAlias) {
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

export {
  getUsernameFromAlias,
};
