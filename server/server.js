import { errorHandler } from "hull-connector";
import { statusHandler, notifyHandler, oAuthHandler } from "./handlers";

import BotFactory from "./bot-factory";

export default function Server(options = {}) {
  const { port, hostSecret, clientID, clientSecret, Hull } = options;
  const { Middleware } = Hull;

  const { controller, connectSlack, getBot } = BotFactory(options);

  controller.setupWebserver(port, (err, app) => {
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
        connectSlack({ hull: req.hull.client, ship: req.hull.ship });
        setTimeout(() => {
          res.redirect(req.header("Referer"));
        }, 2000);
      }
    );

    app.post("/smart-notifier", notifyHandler({ connectSlack }));
    app.all("/status", statusHandler);

    Hull.logger.info("app.start", { port });

    app.use(connector.instrumentation.stopMiddleware());

    app.use(errorHandler);
    return app;
  });
}
