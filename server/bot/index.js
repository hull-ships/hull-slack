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
  return function post(bot, message) {
    ack(bot, message, "mag_right");
    const search = getSearchHash(type, message);
    const { whitelist, actions, hullConfig } = bot.config;
    const hull = new Hull(hullConfig);

    fetchUser({ hull, search, options })
    .then(({ user, events, segments, pagination, msg = "" }) => {
      if (!user) return `¯\\_(ツ)_/¯ ${msg}`;
      const pl = { hull, user, events, segments, actions, pagination, whitelist, full: (options.full || search.rest === "full") };
      // if (search.rest && options.action) pl.group = options.action.value;
      if (search.rest && options.action) pl.group = search.rest;
      const res = userPayload(pl);
      console.log('slack.user.post', JSON.stringify(res, null, 2));
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
const replies = [{
  message: ["^full\\s?<(mailto):(.+?)\\|(.+)>\\s?(.*)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email", { full: true })
}, {
  message: ["^(info|search|whois|who is)?\\s?<(mailto):(.+?)\\|(.+)>$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email", { full: false })
}, {
  message: ["^\\s?<(mailto):(.+?)\\|(.+)>\\s+(.*)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email", { action: 'traits', full: true })
}, {
  message: ["^(events)?\\s?<(mailto):(.+?)\\|(.+)>\\s?(.*)$"],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email", { action: { name: "expand", value: "events" } })
}, {
  message: "^(info|search) id:(.+)",
  context: "direct_message,mention,direct_mention",
  reply: postUser("id")
}, {
  message: ["^info \"(.+)\"\\s?(.*)$", "^info (.+)$"],
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
