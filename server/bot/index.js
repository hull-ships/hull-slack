import Hull from "hull";
import _ from "lodash";
import userPayload from "../lib/user-payload";
import getSearchHash from "../lib/get-search-hash";
import fetchUser from "../hull/fetch-user";
import messages from "./messages";
import ack from "./ack";

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

function sayInPrivate(bot, user_id, msg = []) {
  bot.startPrivateConversation({ user: user_id }, (error, convo) => {
    if (error) return console.log(error);
    _.map(msg, convo.say);
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

function sad(hull, bot, message, err) {
  hull.logger.error("bot.error", err.message);
  return bot.reply(message, ":scream: Something bad happened.");
}
function rpl(hull, bot, message, res) {
  hull.logger.info("bot.reply");
  return bot.reply(message, res);
}


/* MAIN USER ACTION */
function postUser(type, options = {}) {
  return function post(bot, msg) {
    ack(bot, msg, "mag_right");
    const search = getSearchHash(type, msg);
    const { whitelist, actions, hullConfig } = bot.config;
    const hull = new Hull(hullConfig);

    hull.logger.info('hear', { search, options });

    fetchUser({ hull, search, options })
    .then(({ user, events, segments, pagination, message = "" }) => {
      hull.logger.info('fetchUser.fail', { message });
      if (!user) return `¯\\_(ツ)_/¯ ${message}`;

      const { action, full = (search.rest === "full") } = options;
      const pl = { hull, user, events, segments, actions, pagination, whitelist, full };
      if (search.rest) {
        if (action) {
          if (action.name === "expand") pl.group = options.action.value;
        }
      }
      // if (search.rest && options.action) pl.group = search.rest;
      const res = userPayload(pl);
      hull.logger.debug('slack.user.post', res);
      if (pagination.total > 1) res.text = `Found ${pagination.total} users, Showing ${res.text}`;
      return res;
    }, sad.bind(undefined, hull, bot, msg))
    .then(
      rpl.bind(undefined, hull, bot, msg),
      sad.bind(undefined, hull, bot, msg)
    );
  };
}


/* BUTTONS */
const replies = [{
  message: ["^(info|search|whois|who is)?\\s?<(mailto):(.+?)\\|(.+)>$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email")
}, {
  message: ["^\\s*<(mailto):(.+?)\\|(.+)>\\s+(.*)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email", { action: { name: "expand", value: "traits" } })
}, {
  message: ["^events\\s<(mailto):(.+?)\\|(.+)>\\s?(.*)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email", { action: { name: "expand", value: "events" } })
}, {
  message: "^(info|search)\\sid:(.+)",
  context: "direct_message,mention,direct_mention",
  reply: postUser("id")
}, {
  message: ["^info\\s\"(.+)\"\\s?(.*)$", "^info (.+)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("name")
}, {
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
  message: "^kill$",
  reply: (bot, message) => {
    ack(bot, message, "cry");
    bot.reply(message, ":wave: Bby");
    bot.rtm.close();
  }
}
//   message: [
//     "^set\\s+<(mailto):(.+?)\\|(.+)>\\s+(.+)$"
//   ],
//   context: "direct_message,mention,direct_mention",
//   reply: traitUser("email")
// }, {
];


module.exports = {
  replies,
  join,
  sayInPrivate,
  welcome
};
