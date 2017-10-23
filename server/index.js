import Hull from "hull";
import Server from "./server";

if (process.env.LOG_LEVEL) {
  Hull.logger.transports.console.level = process.env.LOG_LEVEL;
}


Server({
  Hull,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  hostSecret: process.env.SECRET || "1234",
  devMode: process.env.NODE_ENV === "development",
  port: process.env.PORT || 8082
});
// const _ = require("lodash");
//
// const currentUser = {
//   email: "yolo@email.com",
//   domain: "email.com"
// };
//
// function replaceMarks(message, channels, members) {
//   const liquidRegex = /{{( *(?:\w*\.*_*-*)*) *\|* *((?:\w*\.*@*_*-*)* *)}}/g;
//   const annotationsRegex = /(\B@([a-z]*[A-Z]*[0-9]*)*)/g;
//   const channelsRegex = /(\B#([a-z]*[A-Z]*[0-9]*)*)/g;
//
//   return message
//     .replace(liquidRegex, (match, userProperty, defaultValue) => {
//       console.log(match);
//       console.log(userProperty, defaultValue);
//       return _.get(currentUser, userProperty, _.isEmpty(!defaultValue) ? defaultValue : "Unknown Value");
//     })
//     .replace(annotationsRegex, (match, prop) => `<@${_.get(_.find(members, member => member.name === prop.replace(/@/, "")), "id", "Unknown User")}>`)
//     .replace(channelsRegex, (match, prop) => `<#${_.get(_.find(channels, channel => channel.name === prop.replace(/#/, "")), "id", "Unknown Channel")}>`);
// }
//
// const message = "siema {{emil|yolo@gmail.commm}}, your correct email is {{email|lo@gmail.commm}} with domain {{domain}} {{domain}}";
//
// console.log(replaceMarks(message, [], []));
// console.log(_.isEmpty(""));
