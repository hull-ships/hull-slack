import _ from "lodash";
import userPayload from "./lib/user-payload";
import humanize from "./lib/humanize";
import getChannels from "./lib/get-channels";
import { sayInPrivate } from "./bot";

function inviteBot(bot, token, channel) {
  const user = bot.config.bot_id;
  return bot.api.channels.invite({ token, channel, user })
  .then(botRes => {
    if (!botRes.ok) {
      throw new Error(botRes.message);
    }
    return channel;
  })
  .catch(err => {
    if (err.message === "already_in_channel") {
      return channel;
    }
    return channel;
  });
}
function createChannels(bot, token, teamChannels = {}, missingChannels = []) {
  return _.map(missingChannels, name => {
    if (teamChannels[name]) return teamChannels[name];
    console.log("Didn't find", teamChannels[name], name);
    return bot.api.channels.create({ token, name }).then(res => res.channel.id);
  });
}
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
    const event_hash = _.compact(_.uniq(_.map(notify_events, (notify) => {
      const { event, channel } = notify;
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

export default function (connectSlack, { message = {} }, { hull = {}, ship = {} }) {
  const bot = connectSlack({ hull, ship });
  const { user = {}, /* segments = [], */ changes = {}, events = [] } = message;

  const { private_settings = {} } = ship;
  const { token = "", user_id = "", actions = [], incoming_webhook = {}, notify_events = [], notify_segments = [] } = private_settings;

  hull.logger.debug("update.process");

  const { url } = incoming_webhook;

  if (!hull || !user.id || !url || !token) { return hull.logger.debug("Something is missing"); }

  const messages = [];

  // Change Triggers
  const changeActions = getChanges(changes, notify_segments);
  const { entered, left } = changeActions;

  // Event Triggers
  const eventActions = getEvents(events, notify_events);
  const { triggered } = eventActions;

  messages.push(...changeActions.messages, ...eventActions.messages);

  const channelNames = _.uniq(_.map(_.concat(entered, left, triggered), c => c.replace('#', '').toLowerCase().replace(/\s+/g, '_').substring(0, 21)));

  if (channelNames.length === 0) return false;
  const payload = userPayload({ ...message, hull, actions, message: messages.join('\n') });
  const tellUser = sayInPrivate.bind(this, bot, user_id);

  getChannels(bot)
  .then(channels => {
    const teamChannels = _.reduce(channels, (m, chan) => { m[chan.name] = chan.id; return m; }, {});
    const botChannels = _.filter(channels, 'is_member');
    const joinChannels = _.pull(channelNames, c => _.find(botChannels, { name: c }));

    Promise.all(createChannels(bot, token, teamChannels, joinChannels))
    .then(
      channelIds => Promise.all(_.map(channelIds, channel => inviteBot(bot, token, channel)))
      , err => hull.logger.error("slack.bot.channels.error", { message: err.message })
    )
    .then(
      channelIds => _.map(channelIds, channel => bot.say({ ...payload, channel }))
      , err => {
        hull.logger.error("slack.bot.notify.error", { message: err });
        tellUser([
          `Couldn't post update to #${err.channel.name}`,
          "It seems I'm not invited.",
          `Invite me by typing \`/invite @hull ${err.channel.name}\``
        ]);
      }
    );
  });
  return true;
}
