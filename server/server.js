import { Strategy as SlackStrategy } from "passport-slack";
import { oAuthHandler, notifHandler, smartNotifierHandler } from "hull/lib/utils";
import updateUser from "./update-user";
import BotFactory from "./bot-factory";

module.exports = function Server(options = {}) {
  const { port, hostSecret, clientID, clientSecret, Hull, devMode } = options;
  const { Middleware } = Hull;
  const { controller, connectSlack, getBot } = BotFactory({ port, hostSecret, clientID, clientSecret, Hull, devMode });

  controller.setupWebserver(port, function onServerStart(err, app) {
    const connector = new Hull.Connector({ port, hostSecret, skipSignatureValidation: devMode });

    connector.setupApp(app);
    controller.createWebhookEndpoints(app);
    // connector.startApp(app);


    app.use("/auth", oAuthHandler({
      hostSecret,
      name: "Slack",
      Strategy: SlackStrategy,
      options: {
        clientID,
        clientSecret,
        scope: "bot, channels:write",
        skipUserProfile: true
      },
      isSetup(req) {
        if (req.query.reset) return Promise.reject();
        const { private_settings = {} } = req.hull.ship;
        const { token, bot = {} } = private_settings;
        const { bot_access_token } = bot;
        return (!!token && !!bot_access_token) ? Promise.resolve({
          credentials: true,
          connected: getBot(bot_access_token)
        }) : Promise.reject({
          credentials: false,
          connected: getBot(bot_access_token)
        });
      },
      onAuthorize: (req) => {
        const { hull = {} } = req;
        const { client, ship } = hull;
        if (!client || !ship) return Promise.reject("Error, no Ship or Client");
        const { accessToken, params = {} } = (req.account || {});
        const { ok, bot = {}, team_id, user_id, incoming_webhook = {} } = params;
        if (!ok) return Promise.reject("Error, invalid reply");
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
        connectSlack({ client, ship: shipData });
        return client.put(ship.id, shipData);
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

      Middleware({ hostSecret, fetchShip: true, cacheShip: true }),

      function onReconnect(req, res) {
        connectSlack({ client: req.hull.client, ship: req.hull.ship });
        setTimeout(() => {
          res.redirect(req.header("Referer"));
        }, 2000);
      });

    const smartNotifierFlowControl = {
      type: "next",
      in: parseInt(process.env.FLOW_CONTROL_IN, 10) || 1000,
      size: parseInt(process.env.FLOW_CONTROL_SIZE, 10) || 100
    };

    app.use("/notify", notifHandler({
      hostSecret,
      handlers: {
        "ship:update": ({ client = {}, ship = {} }) => connectSlack({ client, ship, force: true }),
        "user:update": updateUser.bind(undefined, connectSlack)
      }
    }));

    app.use("/smart-notifier", smartNotifierHandler({
      handlers: {
        "ship:update": ({ client = {}, ship = {}, smartNotifierResponse }) => {
          smartNotifierResponse.setFlowControl(smartNotifierFlowControl);
          return Promise.resolve(connectSlack({ client, ship, force: true }));
        },
        "user:update": (ctx, messages) => {
          ctx.smartNotifierResponse.setFlowControl(smartNotifierFlowControl);
          const update = updateUser.bind(undefined, connectSlack);
          return update(ctx, messages);
        }
      }
    }));


    Hull.logger.info("app.start", { port });

    app.use(connector.instrumentation.stopMiddleware());

    return app;
  });
};
