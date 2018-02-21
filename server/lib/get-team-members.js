//@noflow
export default function getTeamMembers(bot, force = false) {
  if (!force && bot.config.team_members) return bot.config.team_members;

  bot.config.team_members = new Promise((resolve, reject) => {
    bot.api.users.list({}, (err, { ok, members }) => {
      if (err) return reject(err);
      if (!ok) return reject({ message: "Not Ok" });
      return resolve(members);
    });
  }).catch(err => {
    console.log(err);
    delete bot.config.team_members;
  });
  return bot.config.team_members;
}
