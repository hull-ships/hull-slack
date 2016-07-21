import Hull from "hull";
import winstonLogzio from "winston-logzio";
// import winstonSlacker from "winston-slacker";
import Server from "./server";

require("dotenv").config();


if (process.env.NODE_ENV === "development") {
  Hull.logger.transports.console.level = "debug";
}

// Post to Slack Channel directly.
// Hull.logger.add(winstonSlacker,  { webhook, channel, username, iconUrl, iconImoji, customFormatter });
// 

Server({
  Hull,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
