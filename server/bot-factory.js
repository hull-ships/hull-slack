import Botkit from "botkit";
import _ from "lodash";
import interactiveMessage from "./bot/interactive-message";
import { replies, join } from "./bot";
import getTeamChannels from "./lib/get-team-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";

import setupChannels from "./lib/setup-channels";

module.exports = function BotFactory({ Hull, devMode }) {
  const controller = Botkit.slackbot({
    stats_optout: true,
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

  controller.on("create_bot", function botSpawned(bot, config) {
    const { id, bot_id, app_token, user_id, token, channels, hullConfig } = config;
    const hull = new Hull(hullConfig);

    if (_getBotByToken(token)) return hull.logger.debug("bot.create.skip");

    // Cache the bot so we can prevent Race conditions
    _cacheBot(bot);
    hull.logger.info("bot.register");


    bot.startRTM((err /* , __, {  team, self, ok, users }*/) => {
      if (err) {
        // Clear cache if we failed registering RTM
        _clearCache(token);
        return hull.logger.error("bot.register.error", { message: err.message });
      }

      const team = {
        ...config,
        createdBy: user_id,
        bot: {
          token,
          app_token,
          user_id: bot_id,
          createdBy: user_id,
        }
      };
      controller.saveTeam(team, (error) => {
        if (error) return hull.logger.error("bot.team.save.error", { message: error.message });
        hull.logger.log("bot.team.save.success", { ...config.team });
        return setupChannels({ hull, bot, token: app_token, channels });
      });
      /* Create a Hull instance */
      return true;
    });
    return true;
  });

  controller.on("bot_channel_join", join);
  controller.on("bot_channel_join", bot => getTeamChannels(bot, true));
  controller.on("bot_channel_leave", bot => getTeamChannels(bot, true));
  controller.on("interactive_message_callback", interactiveMessage);
  _.map(replies, ({ message = "test", context = "direct_message", middlewares = [], reply = () => {} }) => {
    controller.hears(message, context, ...middlewares, reply);
  });

  return {
    controller,
    getBot: _getBotByToken,
    connectSlack: function connectSlack({ hull, ship, force = false }) {
      if (!ship || !hull || !ship.private_settings || !ship.private_settings.bot) return false;

      const conf = hull.configuration();
      if (!conf.organization || !conf.id || !conf.secret) return false;

      const token = ship.private_settings.bot.bot_access_token;
      const app_token = ship.private_settings.token;

      const channels = getUniqueChannelNames(getNotifyChannels(ship));
      const oldBot = _getBotByToken(token);
      if (oldBot && oldBot.rtm) {
        if (force) {
          oldBot.rtm.close();
          _clearCache(token);
        } else {
          return oldBot;
        }
      }

      const config = {
        ..._.pick(ship.private_settings, "user_id", "actions", "whitelist"),
        id: ship.private_settings.team_id, // TEAM ID
        bot_id: ship.private_settings.bot.bot_user_id,
        channels,
        app_token,
        token, // BOT TOKEN
        // send_via_rtm: true,
        hullConfig: _.pick(conf, "organization", "id", "secret")
      };

      const bot = controller.spawn(config);
      hull.logger.info('slack.bot.create');
      controller.trigger("create_bot", [bot, config]);
      return bot;
    }
  };
};
