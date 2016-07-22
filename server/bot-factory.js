import Botkit from "botkit";
import _ from "lodash";

import { replies, acknowledge, rtm, welcome } from "./bot";

module.exports = function BotFactory({ /* port, hostSecret, clientID, clientSecret, Hull, */devMode }) {
  const controller = Botkit.slackbot({ debug: devMode });
  const _bots = {};

  function _cacheBot(bot) {
    _bots[bot.config.token] = bot;
    return bot;
  }

  function _getBotByToken(token) {
    return _bots[token];
  }

  // controller.storage.teams.all((err, teams) => {
  //   if (err) throw new Error(err);
  //   _.map(teams, (team = {}) => {
  //     if (team.bot) {
  //       controller.spawn(team).startRTM((error, bot, payload) => {
  //         if (error) return console.log("RTM failed");
  //         _cacheBot(bot);
  //       });
  //     }
  //     return true;
  //   });
  // });

  controller.on("create_bot", function createBot(bot, config) {
    if (_getBotByToken(bot.config.token)) return console.log("already online! do nothing.");
    bot.startRTM((err /* , __, {  team, self, ok, users }*/) => {
      if (err) return console.log("RTM failed", err);
      _cacheBot(bot);
      controller.saveTeam(config, function onTeamSaved(team, error /* , id*/) {
        if (error) return console.log("Error saving team", error);
        bot.startPrivateConversation({ user: config.user_id }, welcome);
        return true;
      });
      return true;
    });
    return true;
  });

  controller.on("rtm_open", rtm.open);
  controller.on("rtm_close", rtm.close);
  controller.on("direct_message,mention,direct_mention", acknowledge);

  _.map(replies, ({ message = "test", context = "direct_message", reply = () => {} })=>{
    controller.hears(message, context, reply);
  });

  return {
    controller,
    connectSlack: function connectSlack({ hull, ship }) {
      if (!ship || !hull || !ship.private_settings || !ship.private_settings.bot) return false;

      const conf = hull.configuration();
      if (!conf.organization || !conf.id || !conf.secret) return false;

      const config = {
        ..._.pick(ship.private_settings, "team_id", "user_id"),
        hullConfig: _.pick(conf, "organization", "id", "secret"),
        token: ship.private_settings.bot.bot_access_token
      };

      const bot = controller.spawn(config);
      controller.trigger("create_bot", [bot, config]);
      return true;
    }
  };
};
