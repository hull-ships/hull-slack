export default function getTeamChannels(bot, force = false) {
  if (!force && bot.config.team_channels) return bot.config.team_channels;

  bot.config.team_channels = new Promise((resolve, reject) => {
    bot.api.channels.list({}, (err, { ok, channels }) => {
      if (err) return reject(err);
      if (!ok) return reject({ message: "Not Ok" });
      return resolve(channels);
    });
  }).then(channels => {
    bot.config.team_channels = channels;
    return channels;
  }, (err) => {
    console.log(err);
    delete bot.config.team_channels;
  });

  return bot.config.team_channels;
}
