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

const getActions = (user, traits, events, actions) => ({
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
    }))
    // {
    //   name: "expand",
    //   style: (group === "events") ? "primary" : "default",
    //   value: "events",
    //   text: "Show latest events",
    //   type: "button"
    // }, {
    //   name: "expand",
    //   style: (group === "traits") ? "primary" : "default",
    //   value: "traits",
    //   text: "Show all attributes",
    //   type: "button"
    // }
  ]
});

export function replaceMarks(message, payload, channels, members) {
  const liquidRegex = /{{\s*((?:\w*\.*_*\/*-*)*)\s*\|*\s*((?:\w*\.*@*_*\s*\/*-*)*\s*)}}/g;
  const annotationsRegex = /(\B@([a-z]*[A-Z]*[0-9]*)*)/g;
  const channelsRegex = /(\B#([a-z]*[A-Z]*[0-9]*)*)/g;

  return message
    .replace(liquidRegex, (match, property, defaultValue) =>
      _.get(payload, property, (defaultValue == null || defaultValue === "") ? "Unknown Value" : defaultValue.trim()))
    .replace(annotationsRegex, (match, property) =>
      `<@${_.get(_.find(members, member => member.name === property.replace(/@/, "")), "id", "Unknown User")}>`)
    .replace(channelsRegex, (match, property) =>
      `<#${_.get(_.find(channels, channel => channel.name === property.replace(/#/, "")), "id", "Unknown Channel")}>`);
}

export function userPayload({
  hull,
  user = {},
  events = [],
  event,
  segment,
  segments = {},
  changes = [],
  actions = [],
  whitelist = [],
  message = "",
  liquidMessage,
  defaultMessage = "",
  teamChannels,
  teamMembers,
  group = "",
}) {
  const w = (group ? [] : whitelist);
  const atts = buildAttachments({ hull, user, segments, changes, events, pretext: message, whitelist: w });
  // common items;
  const attachments = _.values(_.pick(atts, "segments", "changes"));

  // "@hull events user@example.com"
  if (!liquidMessage) {
    if (group && group !== "traits") {
      // "@hull user@example.com intercom" -> return only Intercom group;
      const t = _.filter(atts.traits, traitGroup => (traitGroup.fallback.toLowerCase() === group.toLowerCase()));
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
  } else {
    const acts = getActions(user, atts.traits, atts.events, actions, group);
    if (acts && acts.actions && acts.actions.length > 0) {
      attachments.push(acts);
    }
  }

  const basicText = `*<${urlFor(user, hull.configuration().organization)}|${getUserName(user)}>*`;

  return liquidMessage ? {
    text: `${basicText}
${replaceMarks(liquidMessage, { user, event, segment }, teamChannels, teamMembers)}`,
    ...(actions.length > 0) && attachments
  } :
  {
    text: `${basicText}
${defaultMessage}`,
    attachments
  };
};
