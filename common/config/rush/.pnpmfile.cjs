function readPackage(pkg, context) {
  // TODO: temporary, remove when packages stop requesting this unsupported package:
  // > WARN deprecated discord-api-types@0.26.1: No longer supported. Install the latest release!
  if (pkg.name === 'discord.js' || pkg.name === '@discordjs/builders') {
    pkg.dependencies = {
      ...pkg.dependencies,
      'discord-api-types': '^0.27.2'
    }
    context.log('discord-api-types@0.26.1 => discord-api-types@^0.27.2 in dependencies of discord.js')
  }

  if (pkg.name === 'discord.js') {
    pkg.dependencies = {
      ...pkg.dependencies,
      '@discordjs/builders': '^0.12.0'
    }
    context.log('@discordjs/builders@0.11.0 => @discordjs/builders@^0.12.0 in dependencies of discord.js')
  }
  
  // This will change any packages using baz@x.x.x to use baz@1.2.3
  // if (pkg.dependencies.baz) {
  //   pkg.dependencies.baz = '1.2.3';
  // }
  
  return pkg
}

module.exports = {
  hooks: {
    readPackage
  }
}
