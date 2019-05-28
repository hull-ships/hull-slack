//@noflow
import _ from "lodash";
import moment from "moment";
import humanize from "./humanize";
// import flags from "./flags";
import entityUtils from "../util/entity-utils";
import format from "./format-value";

const MOMENT_FORMAT = "MMMM Do YYYY, h:mm:ss a";

function formatObjToText(ob) {
  return _.join(
    _.map(format(_.omit(ob, "id")), p => `*${p.title}*: ${p.value}`),
    "\n"
  );
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
    short: true,
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

function getEntityAttachment({
  traits = {},
  entity = {},
  color,
  pretext,
  targetEntity,
}) {
  const name =
    targetEntity === "user"
      ? entityUtils.getUserName(entity)
      : entityUtils.getDomainName(entity);

  const fields = _.reduce(
    FORMATTER,
    (ff, formatter) => {
      const value = _.get(entity, formatter.key);
      if (value === null || value === undefined) return ff;
      ff.push({
        value: formatter.value(value, entity),
        short: formatter.short,
      });
      return ff;
    },
    []
  );
  let footer = `:eyeglasses: ${moment(entity.last_seen_at).format(
    MOMENT_FORMAT
  )}`;
  if (entity.sessions_count)
    footer = `${footer} :desktop_computer: ${entity.sessions_count}`;
  return {
    mrkdwn_in: ["text", "fields", "pretext"],
    pretext,
    fallback: name,
    color: color(),
    fields,
    footer,
    thumb_url: entity.picture,
  };
}

function getChangesAttachment(changes, color) {
  return !_.size(changes)
    ? {}
    : {
        author_name: ":chart_with_upwards_trend: Changes",
        mrkdwn_in: ["text", "fields", "pretext"],
        color: color(),
        fallback: `Changes: ${_.keys(changes || {}).join(", ")}`,
        text: formatObjToText(_.mapValues(changes, v => `${v[0]} → ${v[1]}`)),
      };
}

function getTraitsAttachments(traits, color) {
  return _.reduce(
    _.pickBy(traits, _.isPlainObject),
    (atts, value, key) => {
      if (_.isObject(value)) {
        atts.push({
          mrkdwn_in: ["text", "fields", "pretext"],
          author_name: `:globe_with_meridians: ${humanize(key)}`,
          text: formatObjToText(value),
          color: color(),
          fallback: key,
        });
      }
      return atts;
    },
    []
  );
}

function cleanAttributeName(attribute) {
  if (attribute.match(/^account\./)) {
    attribute = attribute.replace("account.", "");
  }

  return attribute;
}

function group(entity) {
  return _.reduce(
    entity,
    (grouped, value, key) => {
      let dest = key;
      if (key.match(/^traits_/)) {
        if (key.match(/\//)) {
          dest = key.replace(/^traits_/, "");
        } else {
          dest = key.replace(/^traits_/, "traits/");
        }
      }
      return _.setWith(grouped, dest.split("/"), value, Object);
    },
    {}
  );
}

function getWhitelistedEntity({ entity = {}, entity_whitelist = [] }) {

  // if account variable exists on entity, do not remove the account prefix
  const removeAccountPrefix = entity.account ? false : true;

  entity_whitelist = _.reduce(
    entity_whitelist,
    (cleanList, value, key) => {

      let cleanValue = value;
      if (removeAccountPrefix) {
        cleanValue = cleanAttributeName(value);
      }
      cleanList.push(cleanValue);

      return cleanList;
    },
    []
  );
  let whitelistedEntity = _.pick(entity, entity_whitelist);
  return group(whitelistedEntity);
}

function getSegmentAttachments(
  entity_segment_changes = {},
  entity_segments,
  color
) {
  const segmentString = (_.map(entity_segments, "name") || []).join(", ");
  return {
    author_name: ":busts_in_silhouette: Segments",
    text: segmentString,
    fallback: `Segments: ${segmentString}`,
    color: color(),
    fields: _.map(entity_segment_changes, (segs, action) => {
      const names = _.map(segs, "name");
      const emoji = `:${action === "left" ? "outbox" : "inbox"}_tray:`;
      return {
        title: `${emoji} ${humanize(action)} segment${
          names.length > 1 ? "s" : ""
        }`,
        value: names.join(", "),
      };
    }),
  };
}

function getEventsAttachments(events = [], color) {
  if (!events.length) return {};
  return _.map(events, e => {
    try {
      const { days_since_signup: ds } = e.context || {};
      const actions = [];
      if (e.props && e.props.length) {
        actions.push({
          name: "expand",
          value: "event",
          text: "Show Properties",
          type: "button",
        });
      }
      return {
        title: `:star: ${e.event}`,
        ts: moment(e.created_at).format("X"),
        footer: `:clock2: ${ds} day${Math.abs(ds) === 1 ? "" : "s"} ${
          ds >= 0 ? "after" : "before"
        } signup`,
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

module.exports = function buildAttachments({
  entity = {},
  entity_segments = [],
  entity_changes = {},
  entity_segment_changes = {},
  entity_events = [],
  pretext = "",
  entity_whitelist = [],
  targetEntity,
  options = {},
}) {
  let attachments = {};

  const color = colorFactory();
  let entityAttachment;
  let entity_segments_attachments;
  let entity_changes_attachments;
  let entity_traits_attachments;
  let entity_events_attachments;

  const traits = _.size(entity_whitelist)
    ? getWhitelistedEntity({ entity, entity_whitelist })
    : entity;

  entityAttachment = getEntityAttachment({
    traits,
    entity,
    color,
    pretext,
    targetEntity,
  });

  entity_segments_attachments = getSegmentAttachments(
    entity_segment_changes,
    entity_segments,
    color
  );

  entity_changes_attachments = getChangesAttachment(
    entity_changes[targetEntity],
    color
  );
  entity_traits_attachments = getTraitsAttachments(traits, color);
  entity_events_attachments = getEventsAttachments(entity_events, color);

  attachments[targetEntity] = entityAttachment;
  if (options.sendSegments !== false) {
    attachments["segments"] = entity_segments_attachments;
  }

  attachments["events"] = entity_events_attachments;

  if (options.sendChanges !== false) {
    attachments["changes"] = entity_changes_attachments;
  }
  attachments["traits"] = entity_traits_attachments;

  return attachments;
};
