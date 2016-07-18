import _ from "lodash";
import moment from "moment";
import humanize from "./humanize";
import flags from "./flags";
import getUserName from "./get-user-name";

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
  return [{
    title: `:bust_in_silhouette: ${name}`,
    fallback: name,
    color: color(),
    fields: [
      {
        value: `:love_letter: ${user.email}`,
        short: true
      },
      {
        value: `:telephone_receiver: ${user.phone}`,
        short: true
      },
      {
        value: `${flags(user.address_country)} ${[user.address_country, user.address_state, user.address_city].join(", ")}`,
        short: false
      },
      {
        title: "First Seen",
        value: `:stopwatch: ${moment(user.first_seen_at).format(MOMENT_FORMAT)}`,
        short: true
      },
      {
        title: "Signup",
        value: `:stopwatch: ${moment(user.created_at).format(MOMENT_FORMAT)}`,
        short: true
      }
    ],
    footer: `:desktop_computer: ${user.sessions_count} :eyeglasses: ${moment(user.last_seen_at).format(MOMENT_FORMAT)}`,
    thumb_url: user.picture
  }];
}

function getChangesAttachment(changes, color) {
  return !_.size(changes.user) ? [] : [{
    title: ":chart_with_upwards_trend: Changes",
    color: color(),
    fallback: `Changes: ${_.keys(changes.user || {}).join(", ")}`,
    fields: fieldsFromObject(_.mapValues(changes.user, (v) => `${v[0]} → ${v[1]}`))
  }];
}

function getTraitsAttachments(user, color) {
  return _.reduce(_.pickBy(user, _.isPlainObject), (atts, value, key) => {
    if (_.isObject(value)) {
      atts.push({
        title: `:bell: ${humanize(key)}`,
        color: color(),
        fallback: key,
        fields: fieldsFromObject(value),
      });
    }
    return atts;
  }, []);
}

function getSegmentAttachments(changes = {}, segments, color) {
  const segmentString = (_.map(segments, "name") || []).join(", ");
  return [{
    title: ":busts_in_silhouette: Segments",
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
  }];
}

module.exports = function buildAttachments({ user, segments, changes }) {
  const color = colorFactory();
  return getUserAttachment(user, color)
  .concat(getSegmentAttachments(changes, segments, color))
  .concat(getChangesAttachment(changes, color))
  .concat(getTraitsAttachments(user, color));
};
