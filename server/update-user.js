import _ from "lodash";
import userPayload from "./lib/user-payload";
import humanize from "./lib/humanize";
import setupChannels from "./lib/setup-channels";
import getNotifyChannels from "./lib/get-notify-channels";
import getUniqueChannelNames from "./lib/get-unique-channel-names";
import { sayInPrivate } from "./bot";

const flattenForText = (array = []) => _.map(array, e => `"${e}"`).join(", ");

const getChanges = (changes, notify_segments) => {
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

    _.map(notify_segments, (notify) => {
      const {
        segment, channel, enter, leave
      } = notify;
      if (enter && _.includes(_.map(changes.segments.entered, "id"), segment)) {
        entered.push(channel);
      }
      if (leave && _.includes(_.map(changes.segments.left, "id"), segment)) {
        left.push(channel);
      }
    });
  }
  return { entered, left, messages };
};

const getEvents = (events, notify_events) => {
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
};

const getChannelIds = (teamChannels, channelNames) =>
  _.map(_.filter(teamChannels, t => _.includes(channelNames, t.name)), "id");

const getLoggableMessages = responses =>
  _.groupBy(_.compact(responses), "action");

const reduceActionUsers = actions =>
  _.reduce(
    actions,
    (m, v) => {
      m[v.user_id] = m.message;
      return m;
    },
    {}
  );

const processResponses = (hull, responses) =>
  _.map(getLoggableMessages(responses), (actions, name) => {
    hull.logger.info(`outgoing.user.${name}`, {
      user_ids: _.map(actions, "user_id"),
      data: reduceActionUsers(actions)
    });
  });

export default function (
  connectSlack,
  {
    client: hull, ship, metric, smartNotifierResponse
  },
  messages = []
) {
  return Promise.all(_.map(messages, (message = {}) => {
    const {
      user = {},
      /* segments = [], */ changes = {},
      events = []
    } = message;
    const bot = connectSlack({ hull, ship });
    const { private_settings = {} } = ship;
    const {
      token = "",
      user_id = "",
      actions = [],
      notify_events = [],
      notify_segments = [],
      whitelist = []
    } = private_settings;

    if (!hull || !user.id || !token) {
      return {
        action: "skip",
        user_id: user.id,
        message: `Missing credentials token_exists:${!!token}`
      };
    }

    const client = hull.asUser(user);

    const channels = getUniqueChannelNames(getNotifyChannels(ship));

    // Early return if no channel names configured
    if (!channels.length) {
      return {
        action: "skip",
        user_id: user.id,
        message: "No channels matching to post user"
      };
    }

    const msgs = [];

    // Change Triggers
    const changeActions = getChanges(changes, notify_segments);
    const { entered, left } = changeActions;
    client.logger.debug("outgoing.user.changes", changeActions);

    // Event Triggers
    const eventActions = getEvents(events, notify_events);
    const { triggered } = eventActions;
    client.logger.debug("outgoing.user.events", eventActions);

    // Build message array
    msgs.push(...changeActions.messages, ...eventActions.messages);
    client.logger.debug("outgoing.user.messages", msgs);

    const currentNotificationChannelNames = getUniqueChannelNames(_.concat(entered, left, triggered));

    // Early return if no marching cnannel
    client.logger.debug(
      "outgoing.user.channels",
      currentNotificationChannelNames
    );
    if (!currentNotificationChannelNames.length) {
      return {
        action: "skip",
        user_id: user.id,
        message: "No matching channels"
      };
    }

    // Build entire Notification payload
    const payload = userPayload({
      ...message,
      hull,
      actions,
      message: msgs.join("\n"),
      whitelist
    });

    const post = p => (channel) => {
      client.logger.info("outgoing.user.success", {
        text: p.text,
        channel
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
      channels
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
      .catch((err) => {
        tellUser(
          `:crying_cat_face: Something bad happened while posting to the channels :${
            err.message
          }`,
          err
        );
        client.logger.error("outgoing.user.error", {
          error: err.message
        });
        return null;
      });
  }))
    .then((responses) => {
      if (smartNotifierResponse) {
        smartNotifierResponse.setFlowControl({
          type: "next",
          size: 10,
          in: 1
        });
      }
      processResponses(hull, responses);
    })
    .catch((err) => {
      throw err;
    });
}
