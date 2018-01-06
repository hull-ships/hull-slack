import Hull from "hull";
import server from "./server";
import pkg from "../package.json";
import { dotEnv } from "hull-connector";
dotEnv();

const {
  SECRET = "1234",
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL,
  LOG_LEVEL,
  PORT = 8082
} = process.env;

const options = {
  hostSecret: SECRET,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  devMode: NODE_ENV === "development",
  port: PORT,
  ngrok: {
    subdomain: pkg.name
  },
  Hull,
  clientConfig: {
    firehoseUrl: OVERRIDE_FIREHOSE_URL
  }
};

if (LOG_LEVEL) {
  Hull.logger.transports.console.level = LOG_LEVEL;
}

Hull.logger.transports.console.json = true;
Hull.logger.debug(`${pkg.name}.boot`);

server(options);
Hull.logger.debug(`${pkg.name}.started`, { port: PORT });
