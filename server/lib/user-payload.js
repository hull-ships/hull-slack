import _ from "lodash";
import buildAttachments from "./build-attachments";
import getUserName from "./get-user-name";

function urlFor(user = {}, organization) {
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/users/${user.id}`;
}

function getActions(user, traits, group = "") {
  const actions = _.map(traits, t => {
    const current = group === t.fallback;
    return {
      name: "expand_group",
      style: current ? "primary" : "default",
      value: t.fallback,
      text: t.title,
      type: "button"
    };
  });
  return {
    text: "More Details",
    fallback: "Unable to show more details",
    callback_id: user.id,
    actions,
    color: "#3AA3E3",
    attachment_type: "default"
  };
}

module.exports = function userPayload({ user = {}, segments = {}, changes = [], hull }, action, group = "") {
  const user_url = urlFor(user, hull.configuration().organization);
  const atts = buildAttachments({ user, segments, changes }) || {};
  const actions = getActions(user, atts.traits, group);
  const name = getUserName(user);
  const attachments = [
    atts.user,
    atts.segments,
    atts.changes
  ];
  if (group && atts.traits) {
    attachments.push(_.find(atts.traits, { fallback: group }));
  }
  attachments.push(actions);
  return {
    text: `<${user_url}|${name}> ${action}`,
    attachments
  };
};
