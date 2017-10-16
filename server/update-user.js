import _ from "lodash";
import userPayload from "./lib/user-payload";
import humanize from "./lib/humanize";
import setupChannels from "./lib/setup-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";
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
      const { segment, channel, enter, leave } = notify;
      if (enter && _.includes(_.map(changes.segments.entered, "id"), segment)) entered.push(channel);
      if (leave && _.includes(_.map(changes.segments.left, "id"), segment)) left.push(channel);
    });
  }
  return { entered, left, messages };
}

function getEvents(events, notify_events) {
  const messages = [];
  const triggered = [];
  if (notify_events.length) {
    const event_names = _.map(events, "event");
    const event_hash = _.compact(_.uniq(_.map(notify_events, ({ event, channel }) => {
      if (_.includes(event_names, event)) {
        triggered.push(channel);
        return event;
      }
      return undefined;
    })));
    if (triggered.length) {
      messages.push(`Performed ${flattenForText(event_hash)}`);
    }
  }
  return { triggered, messages };
}

function getChannelIds(teamChannels, channelNames) {
  return _.map(_.filter(teamChannels, t => _.includes(channelNames, t.name)), "id");
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

    if (!client || !user.id || !token) return client.logger.info("outgoing.user.skip", { message: "Missing credentials", token: !!token });

    const asUser = client.asUser(_.pick(user, "email", "id", "external_id"));

    const channels = getUniqueChannelNames(getNotifyChannels(ship));

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

    // Build message array
    msgs.push(...changeActions.messages, ...eventActions.messages);
    asUser.logger.debug("outgoing.user.messages", msgs);

    const currentNotificationChannelNames = getUniqueChannelNames(_.concat(entered, left, triggered));

    // Early return if no marching cnannel
    asUser.logger.debug("outgoing.user.channels", currentNotificationChannelNames);
    if (!currentNotificationChannelNames.length) return asUser.logger.info("outgoing.user.skip", { message: "No matching channels" });

    // Build entire Notification payload
    const payload = userPayload({ ...message, hull: client, actions, message: msgs.join("\n"), whitelist });

    function tellUser(msg, error) {
      asUser.logger.info("outgoing.user.error", { error, message: msg });
      sayInPrivate(bot, user_id, msg);
    }

    return setupChannels({ hull: client, bot, app_token: token, channels })
    .then(({ teamChannels, teamMembers }) => {
      function postToChannel(channel) {
        asUser.logger.info("outgoing.user.success", { text: payload.text, channel });
        return bot.say({ ...payload, channel });
      }
      function postToMember(channel) {
        asUser.logger.info("outgoing.user.success", { text: payload.text, member: channel });
        return bot.say({ ...payload, channel });
      }
      _.map(getChannelIds(teamChannels, currentNotificationChannelNames), postToChannel);
      _.map(getChannelIds(teamMembers, _.map(currentNotificationChannelNames, c => c.replace(/^@/, ""))), postToMember);
    }, err => tellUser(`:crying_cat_face: Something bad happened while setting up the channels :${err.message}`, err))
    .catch(err => tellUser(`:crying_cat_face: Something bad happened while posting to the channels :${err.message}`, err));
  }));
}
