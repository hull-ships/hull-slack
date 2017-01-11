import _ from "lodash";
import userPayload from "./lib/user-payload";
import humanize from "./lib/humanize";
import setupChannels from "./lib/setup-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";
import { sayInPrivate } from "./bot";

function flattenForText(array = []) {
  return _.map(array, e => `"${e}"`).join(', ');
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

export default function (connectSlack, { message = {} }, { hull = {}, ship = {} }) {
  hull.logger.info("hull.slack.notification.start");

  const bot = connectSlack({ hull, ship });
  const { user = {}, /* segments = [], */ changes = {}, events = [] } = message;

  const { private_settings = {} } = ship;
  const {
    token = "",
    user_id = "",
    actions = [],
    notify_events = [],
    notify_segments = [],
    whitelist = []
  } = private_settings;


  if (!hull || !user.id || !token) { return hull.logger.info("hull.slack.notification.skip", { message: "Missing credentials" }); }

  const channels = getUniqueChannelNames(getNotifyChannels(ship));

  // Early return if no channel names configured
  if (!channels.length) return hull.logger.info("hull.slack.notification.skip", { message: "No channels configured" });

  const messages = [];

  // Change Triggers
  const changeActions = getChanges(changes, notify_segments);
  const { entered, left } = changeActions;
  hull.logger.debug("notification.changes", changeActions);

  // Event Triggers
  const eventActions = getEvents(events, notify_events);
  const { triggered } = eventActions;
  hull.logger.debug("notification.events", eventActions);


  // Build message array
  messages.push(...changeActions.messages, ...eventActions.messages);
  hull.logger.debug("notification.messages", messages);

  const currentNotificationChannelNames = getUniqueChannelNames(_.concat(entered, left, triggered));

  // Early return if no marching cnannel
  hull.logger.debug("notification.channels", currentNotificationChannelNames);
  if (!currentNotificationChannelNames.length) return hull.logger.info("hull.slack.notification.skip", { message: "No matching channels" });

  // Build entire Notification payload
  const payload = userPayload({ ...message, hull, actions, message: messages.join('\n'), whitelist });

  const tellUser = sayInPrivate.bind(this, bot, user_id);

  return setupChannels({ hull, bot, token, channels })
  .then((teamChannels) => {
    hull.logger.debug("hull.slack.channels.setup", teamChannels);
    function postToChannel(channel) { return bot.say({ ...payload, channel }); }
    _.map(getChannelIds(teamChannels, currentNotificationChannelNames), postToChannel);
  }, err => tellUser(`:crying_cat_face: Something bad happened while setting up the channels :${err.message}`))
  .catch(err => tellUser(`:crying_cat_face: Something bad happened while posting to the channels :${err.message}`));
}
