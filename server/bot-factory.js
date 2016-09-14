import Hull from "hull";
import Botkit from "botkit";
import _ from "lodash";
import interactiveMessage from "./bot/interactive-message";
import { replies, join } from "./bot";
import getChannels from "./lib/get-channels";

module.exports = function BotFactory({ devMode }) {
  const controller = Botkit.slackbot({
    interactive_replies: true,
    debug: devMode
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

  // controller.storage.teams.all((err, teams) => {
  //   if (err) throw new Error(err);
  //   _.map(teams, (team = {}) => {
  //     controller.spawn(team).startRTM((error, bot) => {
  //       if (error) return console.log("RTM failed");
  //       _cacheBot(bot);
  //       return true;
  //     });
  //     return true;
  //   });
  // });

  controller.on("create_bot", function createBot(bot, config) {
    const hull = new Hull(config.hullConfig);

    if (_getBotByToken(bot.config.bot_token)) return hull.logger.debug("bot.skip");
    // Cache the bot so we can prevent Race conditions
    _cacheBot(bot);
    hull.logger.info("bot.register");

    bot.startRTM((err /* , __, {  team, self, ok, users }*/) => {
      if (err) {
        _clearCache(bot.config.bot_token);
        return hull.logger.error("bot.register.error", err.toString());
      }

      /* Create a Hull instance */
      controller.saveTeam(config, function onTeamSaved(error /* , id*/) {
        if (error) return hull.logger.error("bot.team.save.error", error.toString());
        return true;
      });
      return true;
    });
    return true;
  });

  controller.on("bot_channel_join", join);
  controller.on("bot_channel_join", bot => getChannels(bot, true));
  controller.on("bot_channel_leave", bot => getChannels(bot, true));
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

      const oldBot = _getBotByToken(ship.private_settings.bot.bot_access_token);
      if (oldBot && oldBot.rtm) {
        if (force) {
          oldBot.rtm.close();
          _clearCache(ship.private_settings.bot.bot_access_token);
        } else {
          return oldBot;
        }
      }

      const config = {
        ..._.pick(ship.private_settings, "user_id", "actions"),
        id: ship.private_settings.team_id,
        token: ship.private_settings.bot.bot_access_token,
        hullConfig: _.pick(conf, "organization", "id", "secret"),
        bot_id: ship.private_settings.bot.bot_user_id,
      };

      const bot = controller.spawn(config);
      controller.trigger("create_bot", [bot, config]);
      return bot;
    }
  };
};
