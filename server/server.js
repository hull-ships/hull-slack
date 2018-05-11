// @flow

import { errorHandler } from "hull-connector";
import setupWebserver from "./setup-webserver";
import {
  // previewHandler,
  statusHandler,
  notifyHandler,
  oAuthHandler
} from "./handlers";
import BotFactory from "./bot-factory";
import type { ServerOptions } from "./types";

const { CLIENT_ID, CLIENT_SECRET } = process.env;

export default function Server(options: ServerOptions) {
  const {
    port,
    hostSecret,
    clientID = CLIENT_ID,
    clientSecret = CLIENT_SECRET,
    Hull
  } = options;
  const { Middleware } = Hull;

  const { controller, connectSlack, getBot } = BotFactory(options);

  setupWebserver(controller, port, (err, app) => {
    const connector = new Hull.Connector({ port, hostSecret });
    connector.setupApp(app);
    controller.createWebhookEndpoints(app);

    app.use(
      "/auth",
      oAuthHandler({ connectSlack, clientID, clientSecret, getBot, hostSecret })
    );

    app.get(
      "/connect",
      (req, res, next) => {
        req.hull = { ...req.hull, token: req.query.token };
        next();
      },

      Middleware({ hostSecret, fetchShip: true, cacheShip: true }),

      (req, res) => {
        connectSlack({
          hull: req.hull.client,
          ship: req.hull.ship,
          force: false
        });
        setTimeout(() => {
          res.redirect(req.header("Referer"));
        }, 2000);
      }
    );

    app.post("/smart-notifier", notifyHandler({ connectSlack }));
    app.all("/status", statusHandler);
    // app.post("/preview", previewHandler);

    Hull.logger.info("app.start", { port });

    app.use(connector.instrumentation.stopMiddleware());

    app.use(errorHandler);
    return app;
  });
}
