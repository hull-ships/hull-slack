import _ from "lodash";
import userPayload from "./lib/user-payload";
import humanize from "./lib/humanize";
import setupChannels from "./lib/setup-channels";
import getCleanChannelNames from "./lib/get-clean-channel-names";
// import { sayInPrivate } from "./bot";

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
  hull.logger.info("slack.notification.start");

  const bot = connectSlack({ hull, ship });
  const { user = {}, /* segments = [], */ changes = {}, events = [] } = message;

  const { private_settings = {} } = ship;
  const { token = "", /*user_id = "",*/ actions = [], notify_events = [], notify_segments = [] } = private_settings;


  if (!hull || !user.id || !token) { return hull.logger.info("slack.credentials", { message: "Missing credentials" }); }

  const notifyChannelNames = getCleanChannelNames(_.concat(_.map(notify_segments, 'channel'), _.map(notify_events, 'channel')));
  if (!notifyChannelNames.length) return hull.logger.info("slack.notification.skip", { message: "No channels to notify" });

  const messages = [];

  // Change Triggers
  const changeActions = getChanges(changes, notify_segments);
  const { entered, left } = changeActions;
  hull.logger.debug("slack.notification.changes", changeActions);

  // Event Triggers
  const eventActions = getEvents(events, notify_events);
  const { triggered } = eventActions;
  hull.logger.debug("slack.notification.events", eventActions);


  messages.push(...changeActions.messages, ...eventActions.messages);
  hull.logger.debug("slack.notification.messages", messages);

  const currentNotificationChannelNames = getCleanChannelNames(_.concat(entered, left, triggered));
  hull.logger.debug("slack.notification.channels", currentNotificationChannelNames);

  if (currentNotificationChannelNames.length === 0) return false;

  const payload = userPayload({ ...message, hull, actions, message: messages.join('\n') });
  function postToChannel(channel) { return bot.say({ ...payload, channel }); }

  // const tellUser = sayInPrivate.bind(this, bot, user_id);


  return setupChannels({ hull, bot, token, notifyChannelNames })
  .then(teamChannels => {
    hull.logger.debug("slack.channels.setup", teamChannels);
    const currentNotificationChannelIds = getChannelIds(teamChannels, currentNotificationChannelNames);
    _.map(currentNotificationChannelIds, postToChannel);
  }, err => console.log(err))

  .catch(err => console.log(err));
}

  // hull.logger.error("slack.bot.notify.error", { message: err });
  // tellUser([
  //   `Couldn't post update to #${err.channel.name}`,
  //   "It seems I'm not invited.",
  //   `Invite me by typing \`/invite @hull ${err.channel.name}\``
  // ]);
//     Promise.all(createChannels(bot, token, teamChannels, joinChannels))
//     .then(
//       channelIds => {
//         return Promise.all(_.map(channelNames, name => inviteBot(bot, token, _.find(botChannels, { name }))));
//       }, err => hull.logger.error("slack.bot.channels.error", { message: err.message })
//     )
//     .then(
//       channelIds => _.map(channelIds, channel => bot.say({ ...payload, channel }))
//       , err => {
//       }
//     );
//   });
//   return true;
// }
