export default function getChannels(bot, force = false) {
  if (!force && bot.config.channels) return Promise.resolve(bot.config.channels);
  return new Promise((resolve, reject) => {
    bot.api.channels.list({}, (err, { ok, channels }) => {
      if (err) return reject(err);
      if (!ok) return reject({ message: "Not Ok" });
      return resolve(channels);
    });
  }).then(channels => {
    bot.config.channels = channels;
    return channels;
  });
}
