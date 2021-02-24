//@noflow

import _ from "lodash";

function urlFor({ user = {}, account = {}, organization, entity = "user" }) {
  const id = user.id || account.id;
  const [namespace, domain, tld] = organization.split(".");
  return `https://dashboard.${domain}.${tld}/${namespace}/${entity}s/${id}`;
}

function getUserName({ name, email, first_name, last_name } = {}) {
  return (
    name || email || [first_name, last_name].join(" ").trim() || "Unnamed User"
  );
}

function getDomainName(account = {}) {
  return account.domain || "Unnamed Account";
}

const getChannelIds = (teamChannels, channelNames) =>
  _.map(
    _.filter(teamChannels, t => _.includes(channelNames, t.name)),
    "id"
  );

const getLoggableMessages = responses =>
  _.groupBy(_.compact(responses), "action");

const reduceAction = actions =>
  _.reduce(
    actions,
    (m, v) => {
      m[v.user_id] = v.message;
      return m;
    },
    {}
  );

const processResponses = (hull, responses, targetEntity) =>
  _.map(getLoggableMessages(responses), (actions, name) => {
    hull.logger.info(`outgoing.${targetEntity}.${name}`, {
      account_ids: _.map(actions, "user_id"),
      data: reduceAction(actions),
    });
  });

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

function getAttachments(atts, group, targetEntity) {
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
    // No whitelist: Default payload for attachement;
    // if (!w.length)
  }
  attachments.unshift(atts[targetEntity]);

  return attachments;
}

module.exports = {
  getUserName,
  getDomainName,
  getChannelIds,
  processResponses,
  cast,
  getAttachments,
  urlFor,
};
