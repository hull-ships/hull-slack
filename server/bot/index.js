import Hull from "hull";
import _ from "lodash";
import userPayload from "../lib/user-payload";
import getSearchHash from "../lib/get-search-hash";
import fetchUser from "../hull/fetch-user";
import fetchEvent from "../hull/fetch-event";
import messages from "./messages";
import formatEventProperties from "../lib/format-event-properties";

function _replaceBotName(bot, m = "") {
  return m.replace(/@hull/g, `@${bot.identity.name}`);
}


/* Special Conversations*/
function welcome(bot, user_id) {
  bot.startPrivateConversation({ user: user_id }, (error, convo) => {
    if (error) return console.log(error);
    convo.say(messages.welcome);
    return true;
  });
}

function join(bot, message) {
  bot.say({
    text: messages.join,
    channel: message.channel
  });
}

/* STANDARD BOT REPLIES, WRAPPED WITH LOGGING */
function ack(bot, message, name = "robot_face") {
  if (bot && bot.api) {
    bot.api.reactions.add({
      timestamp: message.ts,
      channel: message.channel,
      name
    }, err => {
      if (err) console.log(err);
      return true;
    });
  }
}
function sad(hull, bot, message, err) {
  console.log('Error', err)
  hull.logger.error("slack.bot.error", err.toString());
  console.log(err.stack);
  return bot.reply(message, ":scream: Something bad happened.");
}
function rpl(hull, bot, message, res) {
  hull.logger.info("slack.bot.reply");
  return bot.reply(message, res);
}

/* ACTIONS */

// function traitUser(type) {
//   return function trait(bot, message) {
//     ack(bot, message, "gear");

//     if (!message.match[4]) return bot.reply(message, "You need to specify a set of properties");

//     try {
//       const payload = JSON.parse(message.match[4]);
//       if (!_.isObject(payload)) throw new Error("Invalid JSON payload");
//       // const qs = querystring.parse()
//       fetchUser(type, bot, message, function callback({ hull, /* search,*/ results }) {
//         if (!results || !results.user) return "¯\\_(ツ)_/¯ Couldn't find anyone!";
//         hull.as(results.user.id).traits(payload);
//         return bot.reply(message, {
//           text: `Updated ${results.user.email}`,
//           attachments: [{
//             pretext: "Allow a few seconds for data to update",
//             text: `\`\`\`\n${JSON.stringify(payload)}\`\`\``,
//             mrkdwn_in: ["text", "pretext"]
//           }]
//         });
//       });
//     } catch (e) {
//       console.log(e);
//       return bot.reply(message, "The JSON you sent is not valid");
//     }
//     return true;
//   };
// }

function postUser(type) {
  return function post(bot, message) {
    ack(bot, message, "mag_right");
    const search = getSearchHash(type, message);
    const hull = new Hull(bot.config.hullConfig);

    fetchUser({ hull, search })
    .then(({ user, events, segments, pagination }) => {
      if (!user) return "¯\\_(ツ)_/¯ Couldn't find anyone!";
      const res = userPayload({ hull, user, events, segments, pagination });
      if (pagination.total > 1) res.text = `Found ${pagination.total} users, Showing ${res.text}`;
      return res;
    }, sad.bind(undefined, hull, bot, message))
    .then(
      rpl.bind(undefined, hull, bot, message),
      sad.bind(undefined, hull, bot, message)
    );
  };
}


/* BUTTONS */
function interactiveMessage(bot, message) {
  const { actions, callback_id, original_message } = message;
  const [action] = actions;
  const { name, value } = action;
  const hull = new Hull(bot.config.hullConfig);

  if (name === "expand") {
    if (value === "event") {
      const index = _.findIndex(original_message.attachments, a => a.callback_id === callback_id);
      const attachement = { ...original_message.attachments[index] };
      const attachments = [...original_message.attachments];
      attachments[index] = attachement;
      return fetchEvent({ hull, search: { id: callback_id } })
      .then(({ events }) => {
        const [event = {}] = events;
        const { props } = event;
        attachement.fields = formatEventProperties(props);
        attachement.actions = [];
        bot.replyInteractive(message, { ...original_message, attachments });
      }).
      catch(err => console.log(err));
    }

    if (value === "traits" || value === "events") {
      return fetchUser({ hull, search: { id: callback_id } })
      .then((results) => bot.replyInteractive(message, userPayload({ ...results, hull, group: value })));
    }
  }
  return true;
}

const replies = [{
  message: ["hello", "hi"],
  context: "direct_message,mention,direct_mention", // Default
  reply: (bot, message) => {
    const hull = new Hull(bot.config.hullConfig);
    return rpl(hull, bot, message, messages.hi);
  }
}, {
  message: "help",
  context: "direct_message,mention,direct_mention", // Default
  reply: (bot, message) => {
    const m = messages[message.text];
    const hull = new Hull(bot.config.hullConfig);
    if (m) return rpl(hull, bot, message, _replaceBotName(bot, m));
    return rpl(hull, bot, message, messages.notfound);
  }
}, {
  message: "^stop",
  reply: (bot, message) => {
    ack(bot, message, "cry");
    bot.reply(message, ":wave: Bby");
    bot.rtm.close();
  }
}, {
  message: ["^(info|search|whois|who is)?\\s?<(mailto):(.+?)\\|(.+)>\\s?(.*)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email")
}, {
  message: "^(info|search) id:(.+)",
  context: "direct_message,mention,direct_mention",
  reply: postUser("id")
}, {
  message: ["^info \"(.+)\"\\s?(.*)$", "^info (.+)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("name")
}
//   message: [
//     "^set\\s+<(mailto):(.+?)\\|(.+)>\\s+(.+)$"
//   ],
//   context: "direct_message,mention,direct_mention",
//   reply: traitUser("email")
// }, {
];


module.exports = {
  rtm: {
    close: (/* bot */) => console.log("** The RTM api just closed"),
    open: (/* bot */) => console.log("** The RTM api just connected!")
  },
  replies,
  join,
  interactiveMessage,
  acknowledge: ack,
  welcome
};
