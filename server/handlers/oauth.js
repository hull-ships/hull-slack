import { Strategy as SlackStrategy } from "passport-slack";
import { oAuthHandler } from "hull/lib/utils";
import _ from "lodash";

export default function oAuth({
  hostSecret,
  getBot,
  clientID,
  clientSecret,
  connectSlack
}) {
  return oAuthHandler({
    hostSecret,
    name: "Slack",
    Strategy: SlackStrategy,
    options: {
      clientID,
      clientSecret,
      scope: "bot, channels:write, users:read",
      skipUserProfile: true
    },
    isSetup(req) {
      if (req.query.reset) return Promise.reject();
      const {
        private_settings: {
          token,
          bot: { bot_access_token: botToken } = {}
        } = {}
      } = req.hull.ship;
      return !!token && !!botToken
        ? Promise.resolve({
            credentials: true,
            connected: getBot(botToken)
          })
        : Promise.reject(
            new Error({
              credentials: false,
              connected: getBot(botToken)
            })
          );
    },
    onAuthorize: req => {
      const { hull = {} } = req;
      const { client, ship } = hull;
      if (!client || !ship)
        return Promise.reject(new Error("No Ship or Client"));
      console.log(req.account);
      const { accessToken: token, params = {} } = req.account || {};
      const { ok } = params;
      if (!ok) return Promise.reject(new Error("Invalid reply"));
      const shipData = {
        private_settings: {
          ...ship.private_settings,
          ..._.pick(params, "team_id", "user_id", "bot", "scope"),
          token
        }
      };
      connectSlack({ hull: client, ship: shipData });
      return client.put(ship.id, shipData);
    },
    views: {
      login: "login.html",
      home: "home.html",
      failure: "failure.html",
      success: "success.html"
    }
  });
}
