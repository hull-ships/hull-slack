import _ from "lodash";
import moment from "moment";
import humanize from "./humanize";
import flags from "./flags";
import getUserName from "./get-user-name";
import format from "./format-value";

const MOMENT_FORMAT = "MMMM Do YYYY, h:mm:ss a";

function fieldsFromObject(ob) {
  if (_.isArray(ob)) {
    return _.map(ob, (title) => { return { title: humanize(title), short: true }; });
  }
  return _.map(ob, (v, title) => {
    let value = _.isBoolean(v) ? humanize(v.toString()) : v;
    value = _.endsWith(title, "_at") ? moment(value).format(MOMENT_FORMAT) : value;
    return { title: humanize(title), value, short: true };
  });
}

// function compactFieldsFromObject(ob) {
//   if (_.isArray(ob)) {
//     return _.map(ob, (title) => { return { value: humanize(title), short: true }; });
//   }
//   return _.map(format(ob), prop => {
//     return { value: `*${prop.title}: * ${prop.value}`, short: false };
//   });
// }

function formatObjToText(ob) {
  return _.join(_.map(format(ob), (p) => `*${p.title}*: ${p.value}`), "\n");
}

function colorFactory() {
  const COLORS = ["#83D586", "#49A2E1", "#FF625A", "#E57831", "#4BC2B8"];
  let i = -1;
  const l = COLORS.length;
  return function cycle() {
    i++;
    return COLORS[i % l];
  };
}

function getUserAttachment(user, color) {
  const name = getUserName(user);
  return {
    mrkdwn_in: ["text", "fields", "pretext"],
    fallback: name,
    color: color(),
    fields: [
      {
        value: `:love_letter: ${user.email || ""}`,
        short: true
      },
      {
        value: `:telephone_receiver: ${user.phone || ""}`,
        short: true
      },
      {
        value: `${flags(user.address_country)} ${_.join(_.compact([user.address_country, user.address_state, user.address_city]), ", ")}`,
        short: false
      },
      {
        value: `:stopwatch: *First Seen*: ${moment(user.first_seen_at).format(MOMENT_FORMAT)}`,
        short: false
      },
      {
        value: `:stopwatch: *Signup*: ${moment(user.created_at).format(MOMENT_FORMAT)}`,
        short: false
      }
    ],
    footer: `:desktop_computer: ${user.sessions_count} :eyeglasses: ${moment(user.last_seen_at).format(MOMENT_FORMAT)}`,
    thumb_url: user.picture
  };
}

function getChangesAttachment(changes, color) {
  return !_.size(changes.user) ? {} : {
    author_name: ":chart_with_upwards_trend: Changes",
    color: color(),
    fallback: `Changes: ${_.keys(changes.user || {}).join(", ")}`,
    fields: fieldsFromObject(_.mapValues(changes.user, (v) => `${v[0]} → ${v[1]}`))
  };
}

function getTraitsAttachments(user, color) {
  return _.reduce(_.pickBy(user, _.isPlainObject), (atts, value, key) => {
    if (_.isObject(value)) {
      atts.push({
        mrkdwn_in: ["text", "fields", "pretext"],
        author_name: `:globe_with_meridians: ${humanize(key)}`,
        text: formatObjToText(value),
        color: color(),
        fallback: key
      });
    }
    return atts;
  }, []);
}

function getSegmentAttachments(changes = {}, segments, color) {
  const segmentString = (_.map(segments, "name") || []).join(", ");
  return {
    author_name: ":busts_in_silhouette: Segments",
    text: segmentString,
    fallback: `Segments: ${segmentString}`,
    color: color(),
    fields: _.map(changes.segments, (segs, action) => {
      const names = _.map(segs, "name");
      const emoji = `:${action === "left" ? "outbox" : "inbox"}_tray:`;
      return {
        title: `${emoji} ${humanize(action)} segment${names.length > 1 ? "s" : ""}`,
        value: names.join(", ")
      };
    })
  };
}

function getEventsAttachements(events = [], color) {
  if (!events.length) return {};
  return _.map(events, e => {
    try {
      const { days_since_signup: ds } = e.context || {};
      // footer:   `:clock2: ${ds} day${(Math.abs(ds) === 1) ? "" : "s"} ${(ds >= 0) ? "after" : "before"} signup | Type: ${e.type} | Source: ${e.source} on ${pp}`
      const actions = [];
      if (e.props.length) {
        actions.push({ name: "expand", value: "event", text: "Show Properties", type: "button" });
      }
      return {
        title: `:star: ${e.event}`,
        ts: moment(e.created_at).format("X"),
        footer: `:clock2: ${ds} day${(Math.abs(ds) === 1) ? "" : "s"} ${(ds >= 0) ? "after" : "before"} signup`,
        fallback: e.event,
        color: color(),
        actions,
        callback_id: e._id,
        attachment_type: "default",
        mrkdwn_in: ["text", "fields", "pretext"],
      };
    } catch (err) {
      console.log(err);
    }
    return true;
  });
}

module.exports = function buildAttachments({ user = {}, segments = [], changes = {}, events = [] }) {
  const color = colorFactory();
  return {
    events: getEventsAttachements(events, color),
    user: getUserAttachment(user, color),
    segments: getSegmentAttachments(changes, segments, color),
    changes: getChangesAttachment(changes, color),
    traits: getTraitsAttachments(user, color)
  };
};
