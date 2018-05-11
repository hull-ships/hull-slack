// @flow

import Hull from "hull";
import { dotEnv } from "hull-connector";
import server from "./server";
import pkg from "../package.json";
import type { ServerOptions } from "./types";

dotEnv();

const {
  SECRET,
  NODE_ENV,
  OVERRIDE_FIREHOSE_URL,
  LOG_LEVEL,
  PORT,
  CLIENT_ID,
  CLIENT_SECRET
} = process.env;

const options: ServerOptions = {
  hostSecret: SECRET || "1234",
  clientID: CLIENT_ID || "",
  clientSecret: CLIENT_SECRET || "",
  devMode: NODE_ENV === "development",
  port: PORT || 8082,
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
