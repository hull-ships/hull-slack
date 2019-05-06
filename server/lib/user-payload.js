//@noflow
import _ from "lodash";
import buildAttachments from "./build-attachments";
import entityUtils from "../util/entity-utils";

function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}

const getActions = (user, traits, events, actions, group = "") => ({
  title: `Actions for ${user.name || user.email}`,
  fallback: "Can't show message actions",
  attachment_type: "default",
  mrkdwn_in: ["text", "fields", "pretext"],
  callback_id: user.id,
  actions: [
    ..._.map(
      _.filter(
        actions,
        a => a.label !== "" && a.property !== "" && a.value !== "",
        a => {
          return {
            name: "trait",
            value: JSON.stringify({
              [a.property.replace(/^traits_/, "")]: entityUtils.cast(a.value),
            }),
            text: a.label,
            type: "button",
          };
        }
      )
    ),
    {
      name: "expand",
      style: group === "events" ? "primary" : "default",
      value: "events",
      text: "Show latest events",
      type: "button",
    },
    {
      name: "expand",
      style: group === "traits" ? "primary" : "default",
      value: "traits",
      text: "Show all attributes",
      type: "button",
    },
  ],
});

module.exports = function userPayload({
  hull,
  user = {},
  events = [],
  segments = {},
  changes = [],
  actions = [],
  whitelist = [],
  message = "",
  group = ""
}) {
  const user_url = urlFor(user, hull.configuration().organization);
  const w = group ? [] : whitelist;
  const atts = buildAttachments({
    entity: user,
    entity_segments: segments,
    entity_changes: changes,
    entity_events: events,
    pretext: message,
    entity_whitelist: w,
    targetEntity: "user",
  });
  const name = entityUtils.getUserName(user);

  // common items;
  const attachments = _.values(_.pick(atts, "segments", "changes"));

  // "@hull events user@example.com"
  if (group === "events" && events.length) {
    attachments.push(...atts.events);
  } else if (group && group !== "traits") {
    // "@hull user@example.com intercom" -> return only Intercom group;
    const t = _.filter(
      atts.traits,
      traitGroup => traitGroup.fallback.toLowerCase() === group.toLowerCase()
    );
    attachments.push(...t);
  } else {
    // "@hull user@example.com full|traits"
    attachments.push(...atts.traits);
    // No whitelist: Default payload for User attachement;
    // if (!w.length)
  }
  attachments.unshift(atts.user);

  // Add Actions
  attachments.push(getActions(user, atts.traits, atts.events, actions, group));

  return {
    text: `*<${user_url}|${name}>*`,
    attachments,
  };
};
