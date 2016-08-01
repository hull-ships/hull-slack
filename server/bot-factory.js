import Hull from "hull";
import Botkit from "botkit";
import _ from "lodash";
import botkitRedis from "botkit-storage-redis";

import { replies, rtm, welcome, join, interactiveMessage } from "./bot";

module.exports = function BotFactory({ devMode }) {
  const controller = Botkit.slackbot({
    interactive_replies: true,
    debug: false,
    storage: botkitRedis({})
  });

  const _bots = {};

  function _cacheBot(bot) {
    _bots[bot.config.token] = bot;
    return bot;
  }

  function _getBotByToken(token) {
    return _bots[token];
  }

  controller.storage.teams.all((err, teams) => {
    if (err) throw new Error(err);
    _.map(teams, (team = {}) => {
      controller.spawn(team).startRTM((error, bot) => {
        if (error) return console.log("RTM failed");
        _cacheBot(bot);
        /* Create a Hull instance */
        console.log("CREATING HULL BOT", bot.config.hullConfig);
        bot.config.hull = new Hull(bot.config.hullConfig);
        return true;
      });
      return true;
    });
  });

  controller.on("create_bot", function createBot(bot, config) {
    if (_getBotByToken(bot.config.token)) return console.log("already online! do nothing.");
    bot.startRTM((err /* , __, {  team, self, ok, users }*/) => {
      if (err) return console.log("RTM failed", err);
      _cacheBot(bot);
      /* Create a Hull instance */
      console.log("CREATING HULL BOT", bot.config.hullConfig);
      bot.config.hull = new Hull(bot.config.hullConfig);
      controller.saveTeam(config, function onTeamSaved(error /* , id*/) {
        if (error) return console.log("Error saving team", error);
        welcome(bot, config.user_id);
        return true;
      });
      return true;
    });
    return true;
  });
  controller.on("rtm_open", rtm.open);
  controller.on("rtm_close", rtm.close);
  controller.on("bot_channel_joined", join);
  controller.on("interactive_message_callback", interactiveMessage);
  _.map(replies, ({ message = "test", context = "direct_message", middlewares = [], reply = () => {} })=>{
    controller.hears(message, context, ...middlewares, reply);
  });

  return {
    controller,
    getBot: _getBotByToken,
    connectSlack: function connectSlack({ hull, ship }) {
      if (!ship || !hull || !ship.private_settings || !ship.private_settings.bot) return false;

      const conf = hull.configuration();
      if (!conf.organization || !conf.id || !conf.secret) return false;

      const config = {
        ..._.pick(ship.private_settings, "user_id"),
        id: ship.private_settings.team_id,
        hullConfig: _.pick(conf, "organization", "id", "secret"),
        token: ship.private_settings.bot.bot_access_token
      };

      const bot = controller.spawn(config);
      controller.trigger("create_bot", [bot, config]);
      return true;
    }
  };
};
