import _ from "lodash";
import messages from "./messages";
import getMessageLogData from "../lib/get-log-data";
/* Special Conversations */
export function welcome(bot, userId) {
  bot.startPrivateConversation({ user: userId }, (error, convo) => {
    if (error) return console.log(error);
    convo.say(messages.welcome);
    return true;
  });
}

export function ack(bot, message, name = "robot_face") {
  if (bot && bot.api) {
    bot.api.reactions.add(
      {
        timestamp: message.ts,
        channel: message.channel,
        name
      },
      err => {
        if (err) console.log(err);
        return true;
      }
    );
  }
}

export function sad(hull, bot, message, err) {
  hull.logger.error("bot.error", { error: err });
  return bot.reply(message, `:scream: Something bad happened (${err.message})`);
}

export function sayInPrivate(bot, userId, msg = []) {
  bot.startPrivateConversation({ user: userId }, (error, convo) => {
    if (error) return console.log(error);
    _.map(msg, convo.say);
    return true;
  });
}

export function join(bot, message) {
  bot.say({
    text: messages.join,
    channel: message.channel
  });
}

export function reply(hull, bot, message, res = {}) {
  hull.logger.info("bot.reply", {
    ...getMessageLogData(message),
    text: res.text
  });
  return bot.reply(message, res);
}
