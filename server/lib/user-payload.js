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

function getActions(user, traits, events, actions, group = "") {
  // let actions = _.map(traits, t => {//   const current = group === t.fallback; //   return {//     name: "expand", //     style: current ? "primary" : "default", //     value: t.fallback, //     text: t.title, //     type: "button"//   }; // });

  return {
    title: `Actions for ${user.name || user.email}`,
    fallback: "Can't show message actions",
    attachment_type: "default",
    mrkdwn_in: ["text", "fields", "pretext"],
    callback_id: user.id,
    actions: [
      ..._.map(actions, a => {
        return {
          name: "trait",
          value: JSON.stringify({ [a.property.replace(/^traits_/, "")]: cast(a.value) }),
          text: a.label,
          type: "button"
        };
      }),
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
        text: "Show user properties",
        type: "button"
      }
    ]
  };
}

module.exports = function userPayload({
  hull,
  user = {},
  events = [],
  segments = {},
  changes = [],
  actions = [],
  action = "",
  group = "",
}) {
  const user_url = urlFor(user, hull.configuration().organization);
  const atts = buildAttachments({ user, segments, changes, events }) || {};
  const name = getUserName(user);
  // atts.user = {
  //   ...atts.user,
  //   ...actions
  // };
  let attachments = [
    atts.user,
    atts.segments,
    atts.changes
  ];

  if (group === "events" && events.length) {
    attachments = attachments.concat(atts.events);
  }
  if (group === "traits") {
    attachments.push(...atts.traits);
  }
  console.log(actions)
  attachments.push(getActions(user, atts.traits, atts.events, actions, group));
  return {
    text: `*<${user_url}|${name}>* ${action}`,
    attachments
  };
};
