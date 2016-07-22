import express from "express";
import path from "path";
import { renderFile } from "ejs";
import { Strategy as SlackStrategy } from "passport-slack";
import updateUser from "./update-user";
import BotFactory from "./bot-factory";
import _ from "lodash";

module.exports = function Server(options = {}) {
  const { port, hostSecret, clientID, clientSecret, Hull, devMode } = options;
  const { NotifHandler, Routes, OAuthHandler } = Hull;
  const { Readme, Manifest } = Routes;

  const app = express();

  app.set("views", `${__dirname}/../views`);
  app.set("view engine", "ejs");
  app.engine("html", renderFile);
  app.use(express.static(path.resolve(__dirname, "..", "dist")));
  app.use(express.static(path.resolve(__dirname, "..", "assets")));

  const { connectSlack } = BotFactory({ port, hostSecret, clientID, clientSecret, Hull, devMode });

  app.use("/auth", OAuthHandler({
    hostSecret,
    name: "Slack",
    Strategy: SlackStrategy,
    options: {
      clientID,
      clientSecret,
      scope: "incoming-webhook, bot",
      skipUserProfile: true
    },
    isSetup(req, { /* hull, */ ship }) {
      if (!!req.query.reset) return Promise.reject();
      const { token } = ship.private_settings || {};
      return (!!token) ? Promise.resolve() : Promise.reject();
    },
    onAuthorize: (req, { hull, ship }) => {
      console.log(req.account);
      const { accessToken, params = {} } = (req.account || {});
      const { ok, bot = {}, team_id, user_id, incoming_webhook = {} } = params;
      if (!ok) return Promise.reject("Error");
      return hull.put(ship.id, {
        private_settings: {
          ...ship.private_settings,
          incoming_webhook,
          bot,
          team_id,
          user_id,
          token: accessToken
        }
      });
    },
    views: {
      login: "login.html",
      home: "home.html",
      failure: "failure.html",
      success: "success.html"
    },
  }));

  app.get("/manifest.json", Manifest(__dirname));
  app.get("/", Readme);
  app.get("/readme", Readme);

  app.post("/notify", NotifHandler({
    hostSecret,
    handlers: {
      "ship:update": ({ message = {} }, { hull = {}, ship = {} }) => connectSlack({ hull, ship }),
      "user:update": updateUser.bind(undefined, connectSlack)
    }
  }));

  app.listen(port);

  Hull.logger.info("started", { port });

  return app;
};
