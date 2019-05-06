// @flow
import _ from "lodash";
import accountPayload from "./lib/account-payload";
import setupChannels from "./lib/setup-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";
import getAccountChanges from "./util/get-account-changes";
import { sayInPrivate } from "./bot";
import type { HullContext, ConnectSlackParams } from "./types";

const getChannelIds = (teamChannels, channelNames) =>
  _.map(_.filter(teamChannels, t => _.includes(channelNames, t.name)), "id");

const getLoggableMessages = responses =>
  _.groupBy(_.compact(responses), "action");

const reduceAction = actions =>
  _.reduce(
    actions,
    (m, v) => {
      m[v.account_id] = v.message;
      return m;
    },
    {}
  );

const processResponses = (hull, responses) =>
  _.map(getLoggableMessages(responses), (actions, name) => {
    hull.logger.info(`outgoing.account.${name}`, {
      account_ids: _.map(actions, "account_id"),
      data: reduceAction(actions),
    });
  });

export default function(
  connectSlack: Object => any,
  { client: hull, ship, metric, smartNotifierResponse }: HullContext,
  messages: Array<Object> = []
): Promise<any> {
  return Promise.all(
    _.map(messages, (message = {}) => {
      const { account = {}, account_segments = [], changes = {} } = message;
      const bot = connectSlack(({ hull, ship }: ConnectSlackParams));
      const { private_settings = {} } = ship;
      const {
        token = "",
        user_id = "",
        account_actions = [],
        notify_account_segments = [],
        account_whitelist = [],
      } = private_settings;

      if (!hull || !account.id || !token) {
        return {
          action: "skip",
          account_id: account.id,
          message: `Missing credentials, current token value: ${token}`,
        };
      }

      const client = hull.asAccount(account);

      let channels = _.map(notify_account_segments, "channel");
      channels = getUniqueChannelNames(channels);

      // Early return if no channel names configured
      if (!channels.length) {
        return {
          action: "skip",
          user_id: message.id,
          message: "No channels matching to post account",
        };
      }

      const slackMessages = [];

      const changeActions = getAccountChanges(changes, notify_account_segments);
      const { entered, left } = changeActions;
      client.logger.debug("outgoing.account.changes", changeActions);

      slackMessages.push(...changeActions.messages);
      client.logger.debug("outgoing.account.messages", {
        messages: slackMessages,
      });

      const currentNotificationChannelNames = getUniqueChannelNames(
        _.concat(entered, left)
      );

      // Early return if no marching channel
      client.logger.debug(
        "outgoing.account.channels",
        currentNotificationChannelNames
      );
      if (!currentNotificationChannelNames.length) {
        return {
          action: "skip",
          user_id: account.id,
          message: "No matching channels",
        };
      }

      // Build entire Notification payload
      const payload = accountPayload({
        ...message,
        hull,
        account_actions,
        message: slackMessages.join("\n"),
        account_whitelist,
      });

      const post = p => channel => {
        client.logger.info("outgoing.account.success", {
          text: p.text,
          channel,
        });
        metric.increment("ship.service_api.call");
        return bot.say({ ...p, channel });
      };

      const tellUser = (msg, error) => {
        client.logger.info("outgoing.account.error", { error, message: msg });
        sayInPrivate(bot, user_id, msg);
      };

      metric.increment("ship.outgoing.accounts");

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
          client.logger.error("outgoing.account.error", {
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
