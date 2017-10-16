import _ from "lodash";
import moment from "moment";
import humanize from "./humanize";
// import flags from "./flags";
import getUserName from "./get-user-name";
import format from "./format-value";

const MOMENT_FORMAT = "MMMM Do YYYY, h:mm:ss a";

function formatObjToText(ob) {
  return _.join(_.map(format(_.omit(ob, "id")), p => `*${p.title}*: ${p.value}`), "\n");
}

function colorFactory() {
  const COLORS = ["#83D586", "#49A2E1", "#FF625A", "#E57831", "#4BC2B8"];
  let i = -1;
  const l = COLORS.length;
  return function cycle() {
    i += 1;
    return COLORS[i % l];
  };
}

const FORMATTER = [
  {
    key: "email",
    value: email => `:love_letter: ${email}`,
    short: true
  },
  // {
  //   key: "phone",
  //   value: phone => `:telephone_receiver: ${phone}`,
  //   short: true
  // },
  // {
  //   key: "address_country",
  //   value: (address = {}, user) => `${flags(user.address_country)} ${_.join(_.compact([user.address_country, user.address_state, user.address_city]), ", ")}`,
  //   short: false
  // },
  // {
  //   key: "first_seen_at",
  //   value: first_seen_at => `:stopwatch: *First Seen*: ${moment(first_seen_at).format(MOMENT_FORMAT)}`,
  //   short: false
  // },
  // {
  //   key: "created_at",
  //   value: created_at => `:stopwatch: *Signup*: ${moment(created_at).format(MOMENT_FORMAT)}`,
  //   short: false
  // }
];

function getUserAttachment(user, color, pretext) {
  const name = getUserName(user);
  const fields = _.reduce(FORMATTER, (ff, formatter) => {
    const value = _.get(user, formatter.key);
    if (value === null || value === undefined) return ff;
    ff.push({ value: formatter.value(value, user), short: formatter.short });
    return ff;
  }, []);
  let footer = `:eyeglasses: ${moment(user.last_seen_at).format(MOMENT_FORMAT)}`;
  if (user.sessions_count) footer = `${footer} :desktop_computer: ${user.sessions_count}`;
  return {
    mrkdwn_in: ["text", "fields", "pretext"],
    pretext,
    fallback: name,
    color: color(),
    fields,
    footer,
    thumb_url: user.picture
  };
}

function getChangesAttachment(changes, color) {
  return !_.size(changes.user) ? {} : {
    author_name: ":chart_with_upwards_trend: Changes",
    mrkdwn_in: ["text", "fields", "pretext"],
    color: color(),
    fallback: `Changes: ${_.keys(changes.user || {}).join(", ")}`,
    text: formatObjToText((_.mapValues(changes.user, v => `${v[0]} → ${v[1]}`)))
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

function getWhitelistedUser({ user = {}, whitelist = [], hull }) {
  return hull.utils.groupTraits(_.reduce(whitelist, (uu, value) => {
    const t = value.indexOf("/") > -1 ? value.replace("/", ".").replace(/^traits_/, "") : value;
    uu[value] = _.get(user, t);
    return uu;
  }, {}));
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

function getEventsAttachments(events = [], color) {
  if (!events.length) return {};
  return _.map(events, (e) => {
    try {
      const { days_since_signup: ds } = e.context || {};
      const actions = [];
      if (e.props && e.props.length) {
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

module.exports = function buildAttachments({ hull, user = {}, segments = [], changes = {}, events = [], pretext = "", whitelist = [] }) {
  const color = colorFactory();
  const traitsSource = (_.size(whitelist) ? getWhitelistedUser({ user, whitelist, hull }) : user);
  return {
    user: getUserAttachment(traitsSource, color, pretext),
    segments: getSegmentAttachments(changes, segments, color),
    events: getEventsAttachments(events, color),
    changes: getChangesAttachment(changes, color),
    traits: getTraitsAttachments(traitsSource, color)
  };
};
