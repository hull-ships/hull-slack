import _ from "lodash";
import buildAttachments from "./build-attachments";
import getUserName from "./get-user-name";

function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}

function cast(v) {
  if (_.isString(v)) {
    // Boolean
    let V = v.toLowerCase();
    if (V === "true" || V === "false") return V === "true";

    // Number
    V = Number(v);
    if (!_.isNaN(V)) return V;
  }
  return v;
}

const getActions = (user, traits, events, actions, group = "") => ({
  title: `Actions for ${user.name || user.email}`,
  fallback: "Can't show message actions",
  attachment_type: "default",
  mrkdwn_in: ["text", "fields", "pretext"],
  callback_id: user.id,
  actions: [
    ..._.map(_.filter(actions, a => (a.label !== "" && a.property !== "" && a.value !== ""), (a) => {
      return {
        name: "trait",
        value: JSON.stringify({ [a.property.replace(/^traits_/, "")]: cast(a.value) }),
        text: a.label,
        type: "button"
      };
    })),
    {
      name: "expand",
      style: (group === "events") ? "primary" : "default",
      value: "events",
      text: "Show latest events",
      type: "button"
    }, {
      name: "expand",
      style: (group === "traits") ? "primary" : "default",
      value: "traits",
      text: "Show all attributes",
      type: "button"
    }
  ]
});

module.exports = function userPayload({
  hull,
  user = {},
  events = [],
  segments = {},
  changes = [],
  actions = [],
  full = false,
  whitelist = [],
  message = "",
  group = "",
}) {
  const user_url = urlFor(user, hull.configuration().organization);
  const atts = buildAttachments({ hull, user, segments, changes, events, pretext: message, whitelist, full });
  const name = getUserName(user);

  let attachments = [
    atts.user,
    atts.segments,
    atts.changes
  ];

  if (group === "events" && events.length) {
    attachments = attachments.concat(atts.events);
  } else if (group !== "" && group !== "traits" && group !== "full" && full) {
    const t = _.filter(atts.traits, traitGroup => (traitGroup.fallback.toLowerCase() === group.toLowerCase()));
    attachments.push(...t);
  } else if (group === "traits" || _.size(whitelist)) {
    attachments.push(...atts.traits);
  }

  attachments.push(getActions(user, atts.traits, atts.events, actions, group));

  return {
    text: `*<${user_url}|${name}>*`,
    attachments
  };
};
