// @flow

import _ from "lodash";
import moment from "moment";
import humanize from "./humanize";
import { objectToText, objectToFields } from "./format-value";
import type { Attribute, Field } from "../types/slack";
import type { Subject } from "../types/hull";

type ColorFn = () => string;

type Segment = {};
type Payload = {
  subject: Subject,
  changes: {
    segments: { [string]: Array<*> },
    user: { [string]: Array<*> }
  },
  segments: Array<Segment>,
  events: Array<{}>,
  color: ColorFn,
  type: string,
  name: string
};

type AttributePayload = {
  name?: string,
  mrkdwn_in?: Array<string>,
  author_name?: string,
  fields?: Array<Field> | null,
  text?: string,
  color?: ColorFn
};

const MRKDN = ["text", "fields", "pretext"];

const getAttr = ({
  fields,
  name,
  text,
  color = () => "#FFF"
}: AttributePayload): Attribute => ({
  mrkdwn_in: MRKDN,
  title: `:globe_with_meridians: ${humanize(name)}`,
  fields,
  color: color(),
  text,
  fallback: name
});

// Nested attribute groups -> [{ attachment }, { attachment }...];
export const getAttributes = ({ subject, color }: Payload): Array<Attribute> =>
  _.compact(
    _.map(_.pickBy(subject, _.isPlainObject), (value, name) => {
      if (!_.isPlainObject(value)) return null;
      return getAttr({ name, text: objectToText(value), color });
    })
  );

export const getSegments = ({
  changes,
  segments,
  color
}: Payload): Attribute => {
  const text = (_.map(segments, "name") || []).join(", ");
  return {
    ...getAttr({
      color,
      text,
      name: text,
      fields: _.map(changes.segments, (segs, action) => {
        const names = _.map(segs, "name");
        const emoji = `:${action === "left" ? "outbox" : "inbox"}_tray:`;
        return {
          title: `${emoji} ${humanize(action)} segment${
            names.length > 1 ? "s" : ""
          }`,
          value: names.join(", ")
        };
      })
    })
  };
};

export const getChanges = ({
  changes,
  type,
  color
}: Payload): Attribute | null => {
  const chg = changes[type];
  if (!_.size(chg)) return null;
  return {
    ...getAttr({
      color,
      text: objectToText(_.mapValues(chg, v => `${v[0]} → ${v[1]}`))
    }),
    fallback: `Changes: ${_.keys(chg || {}).join(", ")}`,
    author_name: ":chart_with_upwards_trend: Changes"
  };
};

export const getEvents = ({
  events = [],
  color
}: Payload): Array<Attribute> => {
  if (!events.length) return [];
  return _.map(events, e => {
    try {
      const { days_since_signup: ds } = e.context || {};
      const actions = [];
      if (e.props && e.props.length) {
        actions.push({
          name: "expand",
          value: "event",
          text: "Show Properties",
          type: "button"
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
        mrkdwn_in: ["text", "fields", "pretext"]
      };
    } catch (err) {
      throw err;
    }
  });
};

// Top level attributes -> { attachment }
const getAccount = ({ subject, name, color }: Payload): Attribute => {
  const fields = _.omit(_.omitBy(subject, _.isPlainObject), "domain");
  const { domain } = subject;
  return {
    ...getAttr({ color, name, text: objectToText(fields) }),
    fields: objectToFields(fields),
    thumb_url: `https://logo.clearbit.com/${domain}`
  };
};

// Top level attributes -> { attachment }
const getUser = ({ subject, name, color }: Payload): Attribute => {
  const { picture } = subject;
  const fields = _.omit(_.omitBy(subject, _.isPlainObject));
  return {
    ...getAttr({ color, name, text: objectToText(fields) }),
    fields: objectToFields(fields),
    thumb_url: picture
  };
};

export const getProfile = (p: Payload): Attribute =>
  (p.type === "account" ? getAccount : getUser)(p);
