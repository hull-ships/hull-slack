import _ from "lodash";
import getTeamChannels from "./get-team-channels";
import getTeamMembers from "./get-team-members";

function inviteBot(bot, token, channels) {
  const user = bot.config.bot_id;
  return Promise.all(_.map(channels, (channel) => {
    return new Promise((resolve, reject) => {
      bot.api.channels.invite(
        { token, channel: channel.id, user },
        function inviteDone(err) {
          if (err) return reject(err);
          return resolve(channel.id);
        }
      );
    });
  }));
}

function createChannels(bot, token, channelsToJoin = []) {
  return Promise.all(_.map(channelsToJoin, (name) => {
    return new Promise((resolve, reject) => {
      bot.api.channels.create({ token, name }, function channelCreated(
        err,
        channel = {}
      ) {
        if (err) return reject(err);
        return resolve(channel.id);
      });
    });
  }));
}

function getNotifyChannels(teamChannels, notifyChannelsNames) {
  return _.filter(teamChannels, channel =>
    _.includes(notifyChannelsNames, channel.name));
}

function getChannelsToJoin(teamChannels, channels) {
  return _.filter(
    teamChannels,
    channel => _.includes(channels, channel.name) && channel.is_member === false
  );
}

function getChannelsToCreate(teamChannels, channels) {
  return _.filter(
    channels,
    channel => !_.includes(_.map(teamChannels, "name"), channel)
  );
}

export default function ({
  hull, bot, app_token, channels
}) {
  return Promise.all([getTeamChannels(false)(bot), getTeamMembers(bot)]).then(
    ([teamChannels, teamMembers]) => {
      const chans = _.filter(channels, c => c.indexOf("@") !== 0);
      const notifyChannels = getNotifyChannels(teamChannels, chans);
      const channelsToJoin = getChannelsToJoin(teamChannels, chans);
      const channelsToCreate = getChannelsToCreate(teamChannels, chans);

      hull.logger.info("bot.setup.start", {
        object: "channel",
        chans,
        teamChannels: _.map(teamChannels, "id"),
        notifyChannels,
        channelsToJoin,
        channelsToCreate
      });

      if (!channelsToCreate.length && !channelsToJoin.length) { return Promise.resolve({ teamChannels, teamMembers }); }

      return createChannels(bot, app_token, channelsToCreate)
        .then(
          () => getTeamChannels(bot, true),
          err =>
            hull.logger.error("bot.setup.error", {
              object: "channel",
              type: "create",
              error: err
            })
        )
        .then(
          () => inviteBot(bot, app_token, channelsToJoin),
          err =>
            hull.logger.error("bot.setup.error", {
              object: "channel",
              type: "refresh",
              error: err
            })
        )
        .catch(err =>
          hull.logger.error("bot.setup.error", {
            object: "channel",
            type: "invite",
            error: err
          }))
        .then(() => ({ teamChannels, teamMembers }));
      // Always return data.
    },
    err => hull.logger.error("bot.setup.error", { error: err })
  );
}
