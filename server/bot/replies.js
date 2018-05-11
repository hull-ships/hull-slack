import Hull from "hull";
import messages from "./messages";
import { ack, reply } from "./utils";
import post from "./post";

function _replaceBotName(bot, m = "") {
  return m.replace(/@hull/g, `@${bot.identity.name}`);
}

/* STANDARD BOT REPLIES, WRAPPED WITH LOGGING */

/* BUTTONS */
const REPLIES = [
  {
    message: ["^(account|domain)\\s+<(.+?)\\|(.+?)>$"],
    context: "direct_message,mention,direct_mention",
    reply: post("domain", { type: "account" })
  },
  {
    message: ["^account\\s+id:(.+)"],
    context: "direct_message,mention,direct_mention",
    reply: post("id", { type: "account" })
  },
  {
    message: ["^user\\s?<(mailto):(.+?)\\|(.+)>$"],
    context: "direct_message,mention,direct_mention",
    reply: post("email", { type: "user" })
  },
  {
    message: [
      "^\\s*<(mailto):(.+?)\\|(.+)>\\s+(.*)$",
      "^attributes\\s*<(mailto):(.+?)\\|(.+)>\\s+(.*)$"
    ],
    context: "direct_message,mention,direct_mention",
    reply: post("email", {
      type: "user",
      action: { name: "expand", value: "traits" }
    })
  },
  {
    message: ["^events\\s<(mailto):(.+?)\\|(.+)>\\s*$"],
    context: "direct_message,mention,direct_mention",
    reply: post("email", {
      type: "user",
      action: { name: "expand", value: "events" }
    })
  },
  {
    message: "^user\\s+id:(.+)",
    context: "direct_message,mention,direct_mention",
    reply: post("id", { type: "user" })
  },
  {
    message: "^user\\s+(.+):(.+)",
    context: "direct_message,mention,direct_mention",
    reply: post("alias", { type: "user" })
  },
  {
    message: "^user\\s(.+)$",
    context: "direct_message,mention,direct_mention",
    reply: post("name", { type: "user" })
  },
  {
    message: ["hello", "hi"],
    context: "direct_message,mention,direct_mention", // Default
    reply: (bot, message) => {
      const hull = new Hull(bot.config.hullConfig);
      return reply(hull, bot, message, messages.hi);
    }
  },
  {
    message: "help",
    context: "direct_message,mention,direct_mention", // Default
    reply: (bot, message) => {
      const m = messages[message.text];
      const hull = new Hull(bot.config.hullConfig);
      if (m) return reply(hull, bot, message, _replaceBotName(bot, m));
      return reply(hull, bot, message, messages.notfound);
    }
  },
  {
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

export default REPLIES;
