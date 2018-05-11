// @flow

import _ from "lodash";
import getPayload from "./lib/payload";
import humanize from "./lib/humanize";
import setupChannels from "./lib/setup-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";
import { sayInPrivate } from "./bot/utils";
import type { UserMessage, Context } from "./types";
import type { connectSlackSignature } from "./bot-factory";

function flattenForText(array = []) {
  return _.map(array, e => `"${e}"`).join(", ");
}

function getChanges(changes, notifySegments) {
  // Changes of Segments
  let messages = [];
  const entered = [];
  const left = [];

  if (
    changes &&
    changes.segments &&
    (changes.segments.entered || changes.segments.left)
  ) {
    messages = _.map(changes.segments, (values, action) => {
      const names = _.map(values, "name");
      const s = names.length > 1 ? "s" : "";
      return `${humanize(action)} segment${s} ${flattenForText(names)}`;
    });

    _.map(notifySegments, notify => {
      const { segment, channel, enter, leave } = notify;
      if (enter && _.includes(_.map(changes.segments.entered, "id"), segment))
        entered.push(channel);
      if (leave && _.includes(_.map(changes.segments.left, "id"), segment))
        left.push(channel);
    });
  }
  return { entered, left, messages };
}

function getEvents(events, notifyEvents) {
  const messages = [];
  const triggered = [];
  if (notifyEvents.length) {
    const eventNames = _.map(events, "event");
    const eventHash = _.compact(
      _.uniq(
        _.map(notifyEvents, ({ event, channel }) => {
          if (_.includes(eventNames, event)) {
            triggered.push(channel);
            return event;
          }
          return undefined;
        })
      )
    );
    if (triggered.length) {
      messages.push(`Performed ${flattenForText(eventHash)}`);
    }
  }
  return { triggered, messages };
}

function getChannelIds(teamChannels, channelNames) {
  return _.map(
    _.filter(teamChannels, t => _.includes(channelNames, t.name)),
    "id"
  );
}

export default function(
  connectSlack: connectSlackSignature,
  { client: hull, ship }: Context,
  message: UserMessage
) {
  const { user, changes, events } = message;
  const bot = connectSlack({ hull, ship });
  const {
    private_settings: {
      token = "",
      user_id: userId = "",
      actions = [],
      notify_events: notifyEvents = [],
      notify_segments: notifySegments = [],
      whitelist = []
    }
  } = ship;

  if (!hull || !user.id || !token)
    return hull.logger.info("outgoing.user.skip", {
      message: "Missing credentials",
      token: !!token
    });

  const client = hull.asUser(_.pick(user, "email", "id", "external_id"));

  const channels = getUniqueChannelNames(getNotifyChannels(ship));

  // Early return if no channel names configured
  if (!channels.length)
    return client.logger.info("outgoing.user.skip", {
      message: "No channels matching to post user"
    });

  const msgs = [];

  // Change Triggers
  const changeActions = getChanges(changes, notifySegments);
  const { entered, left } = changeActions;
  client.logger.debug("outgoing.user.changes", changeActions);

  // Event Triggers
  const eventActions = getEvents(events, notifyEvents);
  const { triggered } = eventActions;
  client.logger.debug("outgoing.user.events", eventActions);

  // Build message array
  msgs.push(...changeActions.messages, ...eventActions.messages);
  client.logger.debug("outgoing.user.messages", msgs);

  const currentNotificationChannelNames = getUniqueChannelNames(
    _.concat(entered, left, triggered)
  );

  // Early return if no marching cnannel
  client.logger.debug(
    "outgoing.user.channels",
    currentNotificationChannelNames
  );
  if (!currentNotificationChannelNames.length)
    return client.logger.info("outgoing.user.skip", {
      message: "No matching channels"
    });

  // Build entire Notification payload
  const payload = getPayload({
    ...message,
    hull,
    actions,
    message: msgs.join("\n"),
    whitelist
  });

  function tellUser(msg, error) {
    client.logger.info("outgoing.user.error", { error, message: msg });
    sayInPrivate(bot, userId, msg);
  }

  return setupChannels({ hull, bot, app_token: token, channels })
    .then(
      ({ teamChannels, teamMembers }) => {
        function postToChannel(channel) {
          client.logger.info("outgoing.user.success", {
            text: payload.text,
            channel
          });
          return bot.say({ ...payload, channel });
        }
        function postToMember(channel) {
          client.logger.info("outgoing.user.success", {
            text: payload.text,
            member: channel
          });
          return bot.say({ ...payload, channel });
        }
        _.map(
          getChannelIds(teamChannels, currentNotificationChannelNames),
          postToChannel
        );
        _.map(
          getChannelIds(
            teamMembers,
            _.map(currentNotificationChannelNames, c => c.replace(/^@/, ""))
          ),
          postToMember
        );
      },
      err =>
        tellUser(
          `:crying_cat_face: Something bad happened while setting up the channels :${
            err.message
          }`,
          err
        )
    )
    .catch(err =>
      tellUser(
        `:crying_cat_face: Something bad happened while posting to the channels :${
          err.message
        }`,
        err
      )
    );
}
