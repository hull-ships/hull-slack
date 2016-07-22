import Hull from "hull";
import _ from "lodash";
import buildUser from "../lib/user-payload";
import fetchUser from "../lib/fetch-user";
import messages from "../lib/messages";

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

function getSearchHash(type, message) {
  const search = {};
  const { match = [] } = message;
  console.log("+================================")
  console.log(match)
  console.log("+================================")
  if (type === "email") {
    search.email = match[3];
    if (match[5]) {
      if (match[5] === "full") {
        search.full = true;
      } else {
        search.groups = _.map(match[5].split(" "), g => g.replace(",", ""));
      }
    }
  } else if (type === "id") {
    search.id = match[1];
    search.groups = match[2].split(" ");
  } else {
    search.name = match[1];
    search.groups = match[2].split(" ");
  }
  return search;
}


function fetch(type, bot, message, callback) {
  const search = getSearchHash(type, message);
  const hull = new Hull(bot.config.hullConfig);

  const sad = function sad(err) {
    hull.logger.error("slack.bot.error", err.toString());
    return bot.reply(message, ":scream: Something bad happened.");
  };
  const reply = function reply(res) {
    hull.logger.info("slack.bot.reply");
    return bot.reply(message, res);
  };

  return fetchUser({ hull, message, search })
  .then(results => callback({ hull, search, results }), sad)
  .then(reply, sad);
}

function postUser(type) {
  return function post(bot, message) {
    ack(bot, message, "mag_right");
    fetch(type, bot, message, function callback({ search, results }) {
      if (!results || !results.user) return "¯\\_(ツ)_/¯ Couldn't find anyone!";

      if (search.groups && search.groups.length) {
        results.user = _.pickBy(results.user, (v, k) => {
          return ! _.isObject(v) || _.includes(search.groups, k);
        });
      } else if (!search.full) {
        results.user = _.omitBy(results.user, _.isObject);
      }
      const res = buildUser(results, "");
      const { pagination } = results;
      if (pagination.total > 1) res.text = `Found ${pagination.total} users, Showing ${res.text}`;
      return res;
    });
  };
}

function traitUser(type) {
  return function trait(bot, message) {
    ack(bot, message, "gear");
    if (!message.match[4]) return bot.reply(message, "You need to specify a set of properties");
    try {
      const payload = JSON.parse(message.match[4]);
      if (!_.isObject(payload)) throw new Error("Invalid JSON payload");
      // const qs = querystring.parse()
      fetch(type, bot, message, function callback({ hull, /* search,*/ results }) {
        if (!results || !results.user) return "¯\\_(ツ)_/¯ Couldn't find anyone!";
        hull.as(results.user.id).traits(payload);
        return bot.reply(message, {
          text: `Updated ${results.user.email}`,
          attachments: [{
            pretext: "Allow a few seconds for data to update",
            text: `\`\`\`\n${JSON.stringify(payload)}\`\`\``,
            mrkdwn_in: ["text", "pretext"]
          }]
        });
      });
    } catch (e) {
      console.log(e);
      return bot.reply(message, "The JSON you sent is not valid");
    }
    return true;
  };
}

const replies = [{
  message: ["hello", "hi"],
  context: "direct_message,mention,direct_mention", // Default
  reply: (bot, message) => bot.reply(message, ":wave: Hullo!")
}, {
  message: ["help"],
  context: "direct_message,mention,direct_mention", // Default
  reply: join
}, {
  message: "^stop",
  reply: (bot, message) => {
    ack(bot, message, "wave");
    bot.reply(message, "Bby");
    bot.rtm.close();
  }
}, {
  message: [
    "^(info|search|whois|who is)?\\s?<(mailto):(.+?)\\|(.+)>\\s?(.*)$"
  ],
  context: "direct_message,mention,direct_mention",
  reply: postUser("email")
}, {
  message: [
    "^set\\s+<(mailto):(.+?)\\|(.+)>\\s+(.+)$"
  ],
  context: "direct_message,mention,direct_mention",
  reply: traitUser("email")
}, {
  message: [
    "^(info|search) id:(.+)"
  ],
  context: "direct_message,mention,direct_mention",
  reply: postUser("id")
}, {
  message: [
    "^info \"(.+)\"\\s?(.*)$",
    "^info (.+)$"
  ],
  context: "direct_message,mention,direct_mention",
  reply: postUser("name")
}, {

}];


module.exports = {
  rtm: {
    close: (/* bot */) => console.log("** The RTM api just closed"),
    open: (/* bot */) => console.log("** The RTM api just connected!")
  },
  replies,
  join,
  acknowledge: ack,
  welcome
};
