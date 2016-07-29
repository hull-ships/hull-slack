import Hull from "hull";
import _ from "lodash";
import userPayload from "../lib/user-payload";
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
function reply(bot, message) {
  const m = messages[message.text];
  if (m) return bot.reply(message, m);
  return bot.reply(message, message.notfound);
}
function cannedReply(msg) {
  return function canned(bot, message) {
    return bot.reply(message, messages[msg]);
  };
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
  if (type === "email") {
    search.email = match[3];
    if (match[5]) {
      if (match[5] === "full") {
        search.full = true;
      } else {
        search.groups = match[5];
      }
    }
  } else if (type === "id") {
    search.id = match[1];
    search.groups = match[2];
  } else {
    search.name = match[1];
  }
  return search;
}

function fetch(search, bot, message, callback) {
  const hull = new Hull(bot.config.hullConfig);

  const sad = function sad(err) {
    hull.logger.error("slack.bot.error", err.toString());
    console.log(err.stack);
    return bot.reply(message, ":scream: Something bad happened.");
  };
  const rpl = function rpl(res) {
    hull.logger.info("slack.bot.reply");
    return bot.reply(message, res);
  };

  return fetchUser({ hull, message, search })
  .then(results => callback(results), sad)
  .then(rpl, sad);
}

function postUser(type) {
  return function post(bot, message) {
    ack(bot, message, "mag_right");
    const search = getSearchHash(type, message);
    fetch(search, bot, message, function callback(results) {
      console.log("Fetch Result", results);
      if (!results || !results.user) return "¯\\_(ツ)_/¯ Couldn't find anyone!";
      const res = userPayload(results, "");
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

function interactiveMessage(bot, message) {
  const { actions, callback_id } = message;
  const [action] = actions;
  const { name, value } = action;
  if (name === "expand_group") {
    fetch({ id: callback_id }, bot, message, function callback(results) {
      // check message.actions and message.callback_id to see what action to take...
      const res = userPayload(results, "", value);
      bot.replyInteractive(message, res);
    });
  }
}

const replies = [{
  message: ["hello", "hi"],
  context: "direct_message,mention,direct_mention", // Default
  reply: cannedReply("hi")
}, {
  message: ["help"],
  context: "direct_message,mention,direct_mention", // Default
  reply
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
  interactiveMessage,
  acknowledge: ack,
  welcome
};
