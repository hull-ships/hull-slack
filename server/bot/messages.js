const more = "_Type `@hull help` and I'll show you what I can do_";

module.exports = {
  hi: ":wave: Hullo!",
  notfound: "¯\\_(ツ)_/¯ Not sure I understand what you mean",
  help: `
Ask me about your users, I can show what I know about them and perform actions.
In your dashboard, you can add buttons to user profiles to perform actions.

Chat with me privately in a direct channel or invite me to a public channel!

:keyboard: *Commands*
_\`@hull user@example.com\` : get info about the user with this email (exact match)_
_\`@hull info Elon Musk\` : get info about the user with this name (tolerates typos)_
_\`@hull kill\`  : shut down the bot (will reboot automatically on next user update)_
  `,

  welcome: `
:tada: Hullo! I am the Hull bot and I've just joined your team
_You can /invite me to a channel or talk to me privately_
${more}
  `,


  join: `
:tada: Hullo everyone! I am the Hull bot and I've just joined this channel.
${more}
  `


};


// _\`@hull set user@example.com {"foo":"bar"}\`: set these properties for the User_
