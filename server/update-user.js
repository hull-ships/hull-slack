import _ from "lodash";
import { userPayload } from "./lib/user-payload";
import humanize from "./lib/humanize";
import setupChannels from "./lib/setup-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getCompactChannelName from "./lib/get-compact-channel-name";
import { sayInPrivate } from "./bot";

function flattenForText(array = []) {
  return _.map(array, e => `"${e}"`).join(", ");
}

function getChanges(changes, notify_segments) {
  // Changes of Segments
  let messages = [];
  const entered = [];
  const left = [];

  if (changes && changes.segments && (changes.segments.entered || changes.segments.left)) {
    messages = _.map(changes.segments, (values, action) => {
      const names = _.map(values, "name");
      const s = (names.length > 1) ? "s" : "";
      return `${humanize(action)} segment${s} ${flattenForText(names)}`;
    });

    _.map(notify_segments, (notify) => {
      const { segment, channel, enter, leave, liquidMessage } = notify;
      if (enter && _.includes(_.map(changes.segments.entered, "id"), segment)) {
        entered.push({
          segment,
          channel,
          liquidMessage,
          defaultMessage: `Entered ${segment}`
        });
      }
      if (leave && _.includes(_.map(changes.segments.left, "id"), segment)) {
        left.push({
          segment,
          channel,
          liquidMessage,
          defaultMessage: `Left ${segment}`
        });
      }
    });
  }
  return { entered, left, messages };
}

function getEvents(events, notify_events) {
  const triggered = [];
  if (notify_events.length) {
    const event_names = _.map(events, "event");
    _.forEach(notify_events, ({ event, channel, liquidMessage }) => { // eslint-disable-line no-unused-vars = `YOLO ${event} @mickaw #testy`
      if (_.includes(event_names, event)) {
        triggered.push({ event, channel, liquidMessage, defaultMessage: `Performed ${event}` });
      }
      // keep compatibility
    });
  }
  return { triggered };
}

function getChannelId(teamChannels, channelName) {
  return _.get(_.find(teamChannels, t => channelName === t.name), "id");
}

export default function (connectSlack, { client, ship }, messages = []) {
  return Promise.all(_.map(messages, (message = {}) => {
    const { user = {}, /* segments = [], */ changes = {}, events = [] } = message;
    const bot = connectSlack({ client, ship });
    const { private_settings = {} } = ship;
    const {
      token = "",
      user_id = "",
      actions = [],
      notify_events = [],
      notify_segments = [],
      whitelist = []
    } = private_settings;

    if (!client || !user.id || !token) {
      return client.logger.info("outgoing.user.skip", {
        message: "Missing credentials",
        token: !!token
      });
    }

    const asUser = client.asUser(_.pick(user, "email", "id", "external_id"));

    const channels = getNotifyChannels(ship).map(getCompactChannelName);

    // Early return if no channel names configured
    if (!channels.length) return asUser.logger.info("outgoing.user.skip", { message: "No channels matching to post user" });

    const msgs = [];

    // Change Triggers
    const changeActions = getChanges(changes, notify_segments);
    const { entered, left } = changeActions;
    asUser.logger.debug("outgoing.user.changes", changeActions);

    // Event Triggers
    const eventActions = getEvents(events, notify_events);
    const { triggered } = eventActions;
    asUser.logger.debug("outgoing.user.events", eventActions);

    const mapNotifications = notifications =>
      _.map(notifications, notification => ({
        channel: getCompactChannelName(notification.channel),
        liquidMessage: notification.liquidMessage,
        defaultMessage: notification.defaultMessage
      }));

    const enteredSegmentsNotifications = mapNotifications(entered);
    const leftSegmentsNotifications = mapNotifications(left);
    const eventsNotifications = mapNotifications(triggered);

    // Early return if no matching channel
    asUser.logger.debug("outgoing.user.channels", enteredSegmentsNotifications, leftSegmentsNotifications, eventsNotifications);
    if (!enteredSegmentsNotifications.length && !leftSegmentsNotifications.length && !eventsNotifications.length) {
      return asUser.logger.info("outgoing.user.skip", { message: "No matching channels" });
    }

    function tellUser(msg, error) {
      asUser.logger.info("outgoing.user.error", { error, message: msg });
      sayInPrivate(bot, user_id, msg);
    }

    return setupChannels({ hull: client, bot, app_token: token, channels })
      .then(({ teamChannels, teamMembers }) => {
        function postToChannel(channel, payload) {
          if (channel) {
            asUser.logger.info("outgoing.user.success", { text: payload.text, channel });
            return bot.say({ ...payload, channel });
          }
          return asUser.logger.info("outgoing.user.skip", { reason: "missing channel" });
        }

        function postToMember(channel, payload) {
          if (channel) {
            asUser.logger.info("outgoing.user.success", { text: payload.text, member: channel });
            return bot.say({ ...payload, channel });
          }
          return asUser.logger.info("outgoing.user.skip", { reason: "missing channel" });
        }

        function sendNotifications(notifications) {
          _.forEach(notifications, (notif) => {
            const payload = userPayload({
              ...message,
              event: notif.event,
              segment: notif.segment,
              hull: client,
              actions,
              message: msgs.join("\n"),
              whitelist,
              liquidMessage: notif.liquidMessage,
              defaultMessage: notif.defaultMessage,
              teamChannels,
              teamMembers
            });

            return _.startsWith(notif.channel, "@")
              ? postToMember(
                getChannelId(teamMembers, notif.channel.replace(/^@/, "")),
                payload)
              : postToChannel(
                getChannelId(teamChannels, notif.channel),
                payload);
          });
        }

        sendNotifications(eventsNotifications);
        sendNotifications(enteredSegmentsNotifications);
        sendNotifications(leftSegmentsNotifications);
      }, err => tellUser(`:crying_cat_face: Something bad happened while setting up the channels :${err.message}`, err))
      .catch(err => tellUser(`:crying_cat_face: Something bad happened while posting to the channels :${err.message}`, err));
  }));
}
