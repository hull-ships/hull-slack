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
    type,
    /* user = {}, */
    subject = {},
    changes = {},
    events = {},
    segments = {},
    message = "",
    group = ""
  } = payload;
  console.log("------Type", type);
  console.log("------Subject", subject);
  const name = getName(subject, type);
  console.log("------Name", name);
  const url = urlFor(subject, type, hull);
  console.log("------Url", url);
  const color = colorFactory();
  console.log(
    "------getProfile",
    getProfile({
      subject,
      name,
      type,
      color
    })
  );
  console.log("------getChanges", getChanges({ changes, type, color }));
  console.log("------Events", getEvents({ events, type, color }));
  console.log("------Attributes", getAttributes({ subject, type, color }));
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
