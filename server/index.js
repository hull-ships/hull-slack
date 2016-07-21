import Hull from "hull";
import Server from "./server";

if (process.env.NODE_ENV === "development") {
  Hull.logger.transports.console.level = "debug";
}

Server({
  Hull,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
