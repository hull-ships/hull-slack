//@noflow

import _ from "lodash";

function getUserName(user = {}) {
  return (
    user.name ||
    user.email ||
    [user.first_name, " ", user.last_name].join(" ") ||
    "Unnamed User"
  );
}

function getDomainName(account = {}) {
  return account.domain || "Unnamed Account";
}

const getChannelIds = (teamChannels, channelNames) =>
  _.map(_.filter(teamChannels, t => _.includes(channelNames, t.name)), "id");

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

module.exports = {
  getUserName,
  getDomainName,
  getChannelIds,
  processResponses,
};
