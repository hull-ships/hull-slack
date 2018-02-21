// @noflow
const getTeamChannels = (force = false) => bot => {
  if (!force && bot.config.team_channels) return bot.config.team_channels;

  bot.config.team_channels = new Promise((resolve, reject) => {
    bot.api.channels.list({}, (err, { ok, channels }) => {
      if (err) return reject(err);
      if (!ok) return reject(new Error({ message: "Not Ok" }));
      return resolve(channels);
    });
  }).catch(err => {
    console.log(err);
    delete bot.config.team_channels;
  });
  return bot.config.team_channels;
};

export default getTeamChannels;
