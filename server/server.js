import express from "express";
import path from "path";
import { renderFile } from "ejs";
import { Strategy as SlackStrategy } from "passport-slack";
import updateUser from "./update-user";
import BotFactory from "./bot-factory";

module.exports = function Server(options = {}) {
  const { port, hostSecret, clientID, clientSecret, Hull, devMode } = options;
  const { NotifHandler, Routes, OAuthHandler } = Hull;
  const { Readme, Manifest } = Routes;

  const { controller, connectSlack, getBot } = BotFactory({ port, hostSecret, clientID, clientSecret, Hull, devMode });

  controller.setupWebserver(port, function onServerStart(err, app) {
    app.set("views", `${__dirname}/../views`);
    app.set("view engine", "ejs");
    app.engine("html", renderFile);
    app.use(express.static(path.resolve(__dirname, "..", "dist")));
    app.use(express.static(path.resolve(__dirname, "..", "assets")));

    controller.createWebhookEndpoints(app);

    app.use("/auth", OAuthHandler({
      hostSecret,
      name: "Slack",
      Strategy: SlackStrategy,
      options: {
        clientID,
        clientSecret,
        scope: "incoming-webhook, bot, channels:write",
        skipUserProfile: true
      },
      isSetup(req, { /* hull, */ ship }) {
        if (!!req.query.reset) return Promise.reject();
        const { token, bot = {} } = ship.private_settings || {};
        const { bot_access_token } = bot || {};
        return (!!token && !!bot_access_token) ? Promise.resolve({
          credentials: true,
          connected: getBot(bot_access_token)
        }) : Promise.reject({
          credentials: false,
          connected: getBot(bot_access_token)
        });
      },
      onAuthorize: (req, { hull, ship }) => {
        const { accessToken, params = {} } = (req.account || {});
        const { ok, bot = {}, team_id, user_id, incoming_webhook = {} } = params;
        if (!ok) return Promise.reject("Error");
        const shipData = {
          private_settings: {
            ...ship.private_settings,
            incoming_webhook,
            bot,
            team_id,
            user_id,
            token: accessToken
          }
        };
        connectSlack({ hull, ship: shipData });
        return hull.put(ship.id, shipData);
      },
      views: {
        login: "login.html",
        home: "home.html",
        failure: "failure.html",
        success: "success.html"
      },
    }));

    app.get("/connect", function parseToken(req, res, next) {
      req.hull = { ...req.hull, token: req.query.token };
      next();
    },
    Hull.Middleware({ hostSecret, fetchShip: true, cacheShip: true }),
    function onReconnect(req, res) {
      connectSlack({ hull: req.hull.client, ship: req.hull.ship });
      setTimeout(() => {
        res.redirect(req.header("Referer"));
      }, 2000);
    });

    app.get("/manifest.json", Manifest(__dirname));
    app.get("/", Readme);
    app.get("/readme", Readme);

    app.post("/notify", NotifHandler({
      hostSecret,
      handlers: {
        "ship:update": ({ message = {} }, { hull = {}, ship = {} }) => connectSlack({ hull, ship, force: true }),
        "user:update": updateUser.bind(undefined, connectSlack)
      }
    }));

    Hull.logger.info("started", { port });
    return app;
  });
};
