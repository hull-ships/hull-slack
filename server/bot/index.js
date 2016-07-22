import Hull from "hull";
import buildUser from "../lib/user-payload";
import _ from "lodash";

function nameQuery(query) {
  return {
    query: {
      multi_match: {
        type: "cross_fields",
        query,
        operator: "and",
        fields: ["first_name", "last_name"]
      }
    },
    sort: {
      created_at: "asc"
    },
    raw: true,
    page: 1,
    per_page: 1
  };
}
function emailQuery(query) {
  return {
    query: {
      multi_match: {
        type: "phrase_prefix",
        query,
        operator: "and",
        fields: ["email", "email.exact^2"]
      }
    },
    sort: {
      created_at: "asc"
    },
    raw: true,
    page: 1,
    per_page: 1
  };
}

function welcome(error, convo) {
  if (error) return console.log(error);
  convo.say("Hullo! I am the Hull bot and I've just joined your team");
  convo.say("You can /invite me to a channel or talk to me privately");
  convo.say("Say @hull user@example.com and I'll tell you everything I know!");
  return true;
}

function acknowledge(bot, message, name = "robot_face") {
  bot.api.reactions.add({
    timestamp: message.ts,
    channel: message.channel,
    name
  }, err => {
    if (err) return console.log(err);
    return true;
  });
}


function findUser(config, { email, name }, hull) {
  const params = (email) ? emailQuery(email) : nameQuery(name);
  return hull.post("search/user_reports", params);
}



function getUser(bot, message) {
  acknowledge(bot, message, "mag_right");
  const hull = new Hull(bot.config.hullConfig);
  const { match = [] } = message;
  const userSearch = {};
  if (match[1] === "mailto") {
    userSearch.email = match[2];
    if (match[4]) {
      userSearch.groups = match[4].split(", ");
    }
  } else {
    userSearch.name = match[1];
  }

  findUser(bot.config, userSearch, hull).then(({ pagination = {}, data = [] }) => {
    const [user = {}, ...rest] = data;
    if (!user.id) return bot.reply(message, "¯\\_(ツ)_/¯ Couldn't find anyone ! ");
    hull.as(user.id)
    .get("/me/segments")
    .then(segments => {
      let groupedUsers = hull.utils.groupTraits(_.omitBy(user, v => (v === null || v === "" || v === undefined)));
      if (userSearch.groups && userSearch.groups.length) {
        groupedUsers = _.reduce(groupedUsers, (m, v, k) => {
          if (_.isObject(v) && !_.includes(groupedUsers, k)) {
            return m;
          }
          m[k] = v;
          return m;
        }, {});
      }
      const u = buildUser({ user: groupedUsers, segments }, hull, "");
      if (pagination.total > 1) {
        u.text = `Found ${pagination.total} users, Showing ${u.text}`;
      }
      return bot.reply(message, u);
    }, err => hull.logger.error("slack.user.segments.error", err.toString()))
    .catch(err => hull.logger.error("slack.user.reply.error", err.toString()));
    return true;
  }, err => hull.logger.error("slack.user.reply.error", err, toString()))
  .catch(err => hull.logger.error("slack.user.search.error", err));
}


const replies = [{
  message: ["hello", "hi"],
  /* context: "direct_message", // Default */
  reply: (bot, message) => bot.reply(message, "Hullo!")
}, {
  message: "^stop",
  reply: (bot, message) => {
    bot.reply(message, "Bby");
    bot.rtm.close();
  }
}, {
  message: [
    "^<(mailto):(.+?)\\|(.+)>\\s?(.*)$",
    "^info <(mailto):(.+?)\\|(.+)>\\s?(.*)$",
    "^info id:(.+)\\s?(.*)$",
    "^info (.+)\\s?(.*)$"
  ],
  context: "direct_message,mention,direct_mention",
  reply: getUser
}];


module.exports = {
  rtm: {
    close: (/* bot */) => console.log("** The RTM api just closed"),
    open: (/* bot */) => console.log("** The RTM api just connected!")
  },
  replies,
  acknowledge,
  welcome,
};
