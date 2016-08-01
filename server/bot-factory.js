import Botkit from "botkit";
import _ from "lodash";
import interactiveMessage from "./bot/interactive-message";
import botkitRedis from "botkit-storage-redis";

import { replies, welcome, join } from "./bot";

module.exports = function BotFactory({ devMode }) {
  const controller = Botkit.slackbot({
    interactive_replies: true,
    debug: devMode,
    storage: botkitRedis({})
  });

  const _bots = {};

  function _cacheBot(bot) {
    _bots[bot.config.token] = bot;
    return bot;
  }
  function _clearCache(token) {
    delete _bots[token];
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
      controller.saveTeam(config, function onTeamSaved(error /* , id*/) {
        if (error) return console.log("Error saving team", error);
        return true;
      });
      return true;
    });
    return true;
  });

  // controller.on("rtm_open", bot => console.log("** The RTM api just connected!"));
  // controller.on("rtm_close", bot => console.log("** The RTM api just closed"));

  controller.on("bot_channel_join", join);
  controller.on("interactive_message_callback", interactiveMessage);
  _.map(replies, ({ message = "test", context = "direct_message", middlewares = [], reply = () => {} })=>{
    controller.hears(message, context, ...middlewares, reply);
  });

  return {
    controller,
    getBot: _getBotByToken,
    connectSlack: function connectSlack({ hull, ship, force = false }) {
      if (!force && (!ship || !hull || !ship.private_settings || !ship.private_settings.bot)) return false;

      const conf = hull.configuration();
      if (!conf.organization || !conf.id || !conf.secret) return false;

      if (force) _clearCache(ship.private_settings.bot.bot_access_token);

      const config = {
        ..._.pick(ship.private_settings, "user_id", "actions"),
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
