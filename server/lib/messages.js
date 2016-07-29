//    _Type \`@hull track user@example.com "event_name" {"foo":"bar"}\` and I'll add this event to the User's profile_

const more = "_Type `@hull help` and I'll show you what I can do";

const help = `
:keyboard: *Commands*
_Type \`@hull user@example.com\` and I'll show you a short snippet about the user_
`;

module.exports = {
  hi: ":wave: Hullo!",
  notfound: "¯\\_(ツ)_/¯ Not sure I understand what you mean",
  help: `
${help}
_Type \`@hull info user@example.com [group_name, group_name2]\` and I'll show just those groups_
_Type \`@hull set user@example.com {"foo":"bar"}\` and I'll set these properties for the User_
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
