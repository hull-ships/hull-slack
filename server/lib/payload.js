import _ from "lodash";
import getName from "./get-name";
import {
  getAttributes,
  getProfile,
  getChanges,
  getEvents,
  getSegments
} from "./attachements";

function urlFor(subject = {}, type, hull) {
  const [namespace, domain, tld] = hull.configuration().organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${subject.id}`;
}

const colorFactory = () => {
  const COLORS = ["#83D586", "#49A2E1", "#FF625A", "#E57831", "#4BC2B8"];
  let i = -1;
  const l = COLORS.length;
  return function cycle() {
    i += 1;
    return COLORS[i % l];
  };
};

export default function buildPayload(payload) {
  const {
    hull,
    /* user = {}, */
    changes = {},
    events = {},
    segments = {},
    account = {},
    message = "",
    group = ""
  } = payload;
  const type = _.size(account) ? "account" : "user";
  const subject = payload[type];
  const name = getName(subject, type);
  const url = urlFor(subject, type, hull);
  const color = colorFactory();
  return {
    text: `*<${url}|${name}>*\n${message}`,
    attachments: _.compact([
      getProfile({
        subject,
        name,
        type,
        color
      }),
      getChanges({ changes, type, color }),
      type === "user" ? getSegments({ changes, segments, type, color }) : null,
      ...(group === "events"
        ? getEvents({ events, type, color })
        : getAttributes({ subject, type, color }))
    ])
  };
}
