//@noflow
import _ from "lodash";
import buildAttachments from "./build-attachments";
import entityUtils from "../util/entity-utils";

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
  group = "",
}) {
  const targetEntity = "user";
  const user_url = entityUtils.urlFor({
    user,
    organization: hull.configuration().organization,
  });
  const w = group ? [] : whitelist;
  const atts = buildAttachments({
    entity: user,
    entity_segments: segments,
    entity_changes: changes,
    entity_events: events,
    pretext: message,
    entity_whitelist: w,
    targetEntity: targetEntity,
  });

  const attachments = entityUtils.getAttachments(atts, group, targetEntity);
  attachments.push(getActions(user, atts.traits, atts.events, actions, group));

  const name = entityUtils.getUserName(user);

  return {
    text: `*<${user_url}|${name}>*`,
    attachments,
  };
};
