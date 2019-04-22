// @flow
import _ from "lodash";
import userPayload from "./lib/user-payload";
import setupChannels from "./lib/setup-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";
import getEvents from "./util/get-events";
import getUserChanges from "./util/get-user-changes";
import getAccountChanges from "./util/get-account-changes";
import { sayInPrivate } from "./bot";
import type { HullContext, ConnectSlackParams } from "./types";

const getChannelIds = (teamChannels, channelNames) =>
  _.map(_.filter(teamChannels, t => _.includes(channelNames, t.name)), "id");

const getLoggableMessages = responses =>
  _.groupBy(_.compact(responses), "action");

const reduceActionUsers = actions =>
  _.reduce(
    actions,
    (m, v) => {
      m[v.user_id] = v.message;
      return m;
    },
    {}
  );

const processResponses = (hull, responses) =>
  _.map(getLoggableMessages(responses), (actions, name) => {
    hull.logger.info(`outgoing.user.${name}`, {
      user_ids: _.map(actions, "user_id"),
      data: reduceActionUsers(actions),
    });
  });

export default function(
  connectSlack: Object => any,
  { client: hull, ship, metric, smartNotifierResponse }: HullContext,
  messages: Array<Object> = []
): Promise<any> {
  return Promise.all(
    _.map(messages, (message = {}) => {
      const {
        user,
        account,
        segments = [],
        account_segments = [],
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
        notify_account_segments = [],
        whitelist = [],
      } = private_settings;

      if (!hull || (!user && !account) || !token) {
        return {
          action: "skip",
          user_id: user === undefined ? "" : user.id,
          account_id: account === undefined ? "" : account.id,
          message: `Missing credentials, current token value: ${token}`,
        };
      }

      const targetEntity = user !== undefined ? "user" : "account";

      const client =
        user !== undefined ? hull.asUser(user) : hull.asAccount(account);

      const channels = getUniqueChannelNames(getNotifyChannels(ship));

      // Early return if no channel names configured
      if (!channels.length) {
        return {
          action: "skip",
          user_id: user === undefined ? "" : user.id,
          account_id: account === undefined ? "" : account.id,
          message: "No channels matching to post user",
        };
      }

      const slackMessages = [];

      // Change Triggers
      const changeActions =
        user !== undefined
          ? getUserChanges(changes, notify_segments)
          : getAccountChanges(changes, notify_account_segments);

      const { entered, left } = changeActions;
      client.logger.debug(`outgoing.${targetEntity}.changes`, changeActions);

      const userSegmentIds = _.map(segments, "id");
      const accountSegmentIds = _.map(account_segments, "id");
      // Event Triggers
      const eventActions = getEvents(
        events,
        notify_events,
        userSegmentIds,
        accountSegmentIds
      );
      const { triggered } = eventActions;
      client.logger.debug(`outgoing.${targetEntity}.events`, eventActions);

      // Build message array
      slackMessages.push(...changeActions.messages, ...eventActions.messages);
      client.logger.debug(`outgoing.${targetEntity}.messages`, {
        messages: slackMessages,
      });

      const currentNotificationChannelNames = getUniqueChannelNames(
        _.concat(entered, left, triggered)
      );

      // Early return if no marching cnannel
      client.logger.debug(
        `outgoing.${targetEntity}.channels`,
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
        client.logger.info(`outgoing.${targetEntity}.success`, {
          text: p.text,
          channel,
        });
        metric.increment("ship.service_api.call");
        return bot.say({ ...p, channel });
      };

      const tellUser = (msg, error) => {
        client.logger.info(`outgoing.${targetEntity}.error`, {
          error,
          message: msg,
        });
        sayInPrivate(bot, user_id, msg);
      };

      if (user) {
        metric.increment("ship.outgoing.users");
      } else {
        metric.increment("ship.outgoing.accounts");
      }

      return setupChannels({
        hull,
        bot,
        app_token: token,
        channels,
      })
        .then(({ teamChannels, teamMembers }) => {
          const channel_ids = getChannelIds(
            teamChannels,
            currentNotificationChannelNames
          );
          const member_ids = getChannelIds(
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
          client.logger.error(`outgoing.${targetEntity}.error`, {
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
    processResponses(hull, responses);
  });
}
