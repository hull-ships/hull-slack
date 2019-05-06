// @flow
import _ from "lodash";
import userPayload from "./lib/user-payload";
import setupChannels from "./lib/setup-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";
import getEvents from "./util/get-events";
import getUserChanges from "./util/get-user-changes";
const entityUtils = require("./util/entity-utils");
import { sayInPrivate } from "./bot";
import type { HullContext, ConnectSlackParams } from "./types";


export default function(
  connectSlack: Object => any,
  { client: hull, ship, metric, smartNotifierResponse }: HullContext,
  messages: Array<Object> = []
): Promise<any> {
  return Promise.all(
    _.map(messages, (message = {}) => {
      const {
        user,
        segments = [],
        changes = {},
        events = [],
      } = message;
      const bot = connectSlack(({ hull, ship }: ConnectSlackParams));
      const { private_settings = {} } = ship;
      const {
        token = "",
        user_id = "",
        actions = [],
        notify_events = [],
        notify_segments = [],
        whitelist = [],
      } = private_settings;

      if (!hull || !user.id || !token) {
        return {
          action: "skip",
          user_id: user.id,
          message: `Missing credentials, current token value: ${token}`,
        };
      }

      const client = hull.asUser(user);

      const channels = getUniqueChannelNames(getNotifyChannels(ship));

      // Early return if no channel names configured
      if (!channels.length) {
        return {
          action: "skip",
          user_id: user.id,
          message: "No channels matching to post user",
        };
      }

      const slackMessages = [];

      // Change Triggers
      const changeActions = getUserChanges(
        changes,
        notify_segments,
        notify_events
      );
      const { entered, left } = changeActions;
      client.logger.debug("outgoing.user.changes", changeActions);

      const userSegmentIds = _.map(segments, "id");

      // Event Triggers
      const eventActions = getEvents(events, notify_events, userSegmentIds);
      const { triggered } = eventActions;
      client.logger.debug("outgoing.user.events", eventActions);

      // Build message array
      slackMessages.push(...changeActions.messages, ...eventActions.messages);
      client.logger.debug("outgoing.user.messages", {
        messages: slackMessages,
      });

      const currentNotificationChannelNames = getUniqueChannelNames(
        _.concat(entered, left, triggered)
      );

      // Early return if no marching cnannel
      client.logger.debug(
        "outgoing.user.channels",
        currentNotificationChannelNames
      );
      if (!currentNotificationChannelNames.length) {
        return {
          action: "skip",
          user_id: user.id,
          message: "No matching channels",
        };
      }

      // Build entire Notification payload
      const payload = userPayload({
        ...message,
        hull,
        actions,
        message: slackMessages.join("\n"),
        whitelist,
      });

      const post = p => channel => {
        client.logger.info("outgoing.user.success", {
          text: p.text,
          channel,
        });
        metric.increment("ship.service_api.call");
        return bot.say({ ...p, channel });
      };

      const tellUser = (msg, error) => {
        client.logger.info("outgoing.user.error", { error, message: msg });
        sayInPrivate(bot, user_id, msg);
      };

      metric.increment("ship.outgoing.users");

      return setupChannels({
        hull,
        bot,
        app_token: token,
        channels,
      })
        .then(({ teamChannels, teamMembers }) => {
          const channel_ids = entityUtils.getChannelIds(
            teamChannels,
            currentNotificationChannelNames
          );
          const member_ids = entityUtils.getChannelIds(
            teamMembers,
            _.map(currentNotificationChannelNames, c => c.replace(/^@/, ""))
          );
          _.map(channel_ids, post(payload));
          _.map(member_ids, post(payload));
          return null;
        })
        .catch(err => {
          tellUser(
            `:crying_cat_face: Something bad happened while posting to the channels :${
              err.message
            }`,
            err
          );
          client.logger.error("outgoing.user.error", {
            error: err.message,
          });
          return null;
        });
    })
  ).then(responses => {
    if (smartNotifierResponse) {
      smartNotifierResponse.setFlowControl({
        type: "next",
        size: 100,
        in: 1,
      });
    }
    entityUtils.processResponses(hull, responses, "user");
  });
}
