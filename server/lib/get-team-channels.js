// @noflow
const _ = require("lodash");
function getChannels({ bot, cursor = "", pagedChannels = [] }) {
  const options = {
    limit: 9999,
    exclude_archived: true,
    exclude_members: true,
  };

  if (!_.isEmpty(cursor)) {
    _.set(options, "cursor", cursor);
  }

  return new Promise((resolve, reject) => {
    return bot.api.conversations.list(
      options,
      (err, { ok, channels, response_metadata }) => {
        if (err) return reject(err);
        if (!ok) return reject(new Error({ message: "Not Ok" }));

        Array.prototype.push.apply(pagedChannels, channels);
        const { next_cursor } = response_metadata;
        if (!_.isEmpty(next_cursor)) {
          return getChannels({ bot, cursor: next_cursor, pagedChannels });
        }
        return resolve(pagedChannels);
      }
    );
  });
}
const getTeamChannels = (force = false) => bot => {
  if (!force && bot.config.team_channels) return bot.config.team_channels;

  return getChannels({ bot }).then(channels => {
    bot.config.team_channels = channels;
    return bot.config.team_channels;
  });
};

export default getTeamChannels;
